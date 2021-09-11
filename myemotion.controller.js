const Content = require('../../models/content.model')
const ReactionEmotionData = require('../../models/reactionEmotionData.model')
const HeatMapData = require('../../models/heatMapData.model')
const async = require('async')

const salientSceneController = require('../salient-scene.controller')
const Math = require('mathjs')
const customImageHelper = require('../custom_image_helper.js')
const AdditionalCohorts = require('../../models/custom_cohort.model')
const reactionEmotionDataModel = require('../../models/reactionEmotionData.model')

const getUniqueUserIds = (arrays) => {
  return arrays.shift().reduce(function (res, v) {
    if (res.indexOf(v) === -1 && arrays.every(function (a) {
      return a.indexOf(v) !== -1
    })) res.push(v)
    return res
  }, [])
}

Array.prototype.contains = function (v) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] === v) return true
  }
  return false
}

Array.prototype.unique = function () {
  var arr = []
  for (var i = 0; i < this.length; i++) {
    if (!arr.contains(this[i])) {
      arr.push(this[i])
    }
  }
  return arr
}

function flat (input, depth = 1, stack = []) {
  for (const item of input) {
    if (item instanceof Array && depth > 0) {
      flat(item, depth - 1, stack)
    } else {
      stack.push(item)
    }
  }

  return stack
}

function setDefaultValue (value, defaultValue) {
  try {
    return (value === undefined) ? defaultValue : value
  } catch (e) {
    return defaultValue
  }
}


    // Get 6 peaks and valleys for an emotion
var getEmotionPeaksAndValleys = (emotionDataObj, emotion) => {
        try {
          var emotionData = emotionDataObj
          var peaksList = []
          var valleysList = []
      
          // We will continuously reduce this as we get peaks
          var emotionGraphPositive = emotionData
          // We will continuously reduce this as we get valleys
          var emotionGraphNegative = emotionData
      
          // This may differ from the content's actual length,
          // but we need to work with what emotion data is available
          var contentEmotionLength = Math.floor(Math.max.apply(Math, emotionData.map(function (o) { return o.time })))
      
          // This is the length to the left and right of the max that we use to prevent peaks
          // being too close together
          var barrierRadius = Math.floor(contentEmotionLength * 0.1)
      
          // Positive
          // Get peaks, the number of peaks can change
          for (var peakIndex = 0; peakIndex < 3; peakIndex++) {
          // Get peak
            var peakObj = emotionGraphPositive.reduce((max, obj) => max[emotion] > obj[emotion] ? max : obj)
            // Push to list
            peaksList.push(peakObj.time)
      
            // Set up barrier so we don't get any more peaks from this area
      
            // Remove this barrier range from data so we don't use it again
            emotionGraphPositive = emotionGraphPositive.filter(obj => obj.time < peakObj.time - barrierRadius || obj.time > peakObj.time + barrierRadius)
          }
      
          // Get valleys
          for (var valleyIndex = 0; valleyIndex < 3; valleyIndex++) {
          // Get valley
            var valleyObject = emotionGraphNegative.reduce((min, obj) => min[emotion] < obj[emotion] ? min : obj)
            // Push to list
            valleysList.push(valleyObject.time)
      
            // Remove this from data so we don't use it again
            emotionGraphNegative = emotionGraphNegative.filter(obj => obj.time < valleyObject.time - barrierRadius || obj.time > valleyObject.time + barrierRadius)
          }
          return ({
            peaks: peaksList,
            valleys: valleysList
          })
        } catch (e) {
          console.log(e)
          return null
        }
      }

function reactionEmotionExtremes3 (returnGraphData) {
  var emotionExtremes = {
    neutral: getEmotionPeaksAndValleys(returnGraphData, 'neutral'),
    sad: getEmotionPeaksAndValleys(returnGraphData, 'sad'),
    happy: getEmotionPeaksAndValleys(returnGraphData, 'happy'),
    scare: getEmotionPeaksAndValleys(returnGraphData, 'scare'),
    angry: getEmotionPeaksAndValleys(returnGraphData, 'angry'),
    disgust: getEmotionPeaksAndValleys(returnGraphData, 'disgust'),
    surprised: getEmotionPeaksAndValleys(returnGraphData, 'surprised'),
    evalence: getEmotionPeaksAndValleys(returnGraphData, 'evalence'),
    arousal: getEmotionPeaksAndValleys(returnGraphData, 'arousal'),
    attention: getEmotionPeaksAndValleys(returnGraphData, 'attention')

  }

  var extremes = {

    emotion: emotionExtremes
  }

  return extremes
}
function retrieveOverallReaction3 (results, _errors, returnEmotionData) {
  var overallEmotion = {
    happy: 0,
    sad: 0,
    scare: 0,
    disgust: 0,
    surprised: 0,
    neutral: 0,
    angry: 0,
    evalence: 0,
    arousal: 0,
    eTotal: 0,
    attention: 0
  }

  for (var f = 0; f < returnEmotionData.length; f++) {
    overallEmotion.happy += returnEmotionData[f].happy
    overallEmotion.sad += returnEmotionData[f].sad
    overallEmotion.scare += returnEmotionData[f].scare
    overallEmotion.disgust += returnEmotionData[f].disgust
    overallEmotion.surprised += returnEmotionData[f].surprised
    overallEmotion.neutral += returnEmotionData[f].neutral
    overallEmotion.angry += returnEmotionData[f].angry
    overallEmotion.evalence += returnEmotionData[f].evalence // Use this instead to get metric version
    overallEmotion.arousal += returnEmotionData[f].arousal
    overallEmotion.attention += returnEmotionData[f].attention
    overallEmotion.eTotal += returnEmotionData[f].eTotal
    delete returnEmotionData[f].metricValence
  }

  if (overallEmotion.eTotal > 0) {
    overallEmotion.happy = parseFloat(((overallEmotion.happy / overallEmotion.eTotal) * 100).toFixed(2))
    overallEmotion.sad = parseFloat(((overallEmotion.sad / overallEmotion.eTotal) * 100).toFixed(2))
    overallEmotion.scare = parseFloat(((overallEmotion.disgust / overallEmotion.eTotal) * 100).toFixed(2))
    overallEmotion.surprised = parseFloat(((overallEmotion.surprised / overallEmotion.eTotal) * 100).toFixed(2))
    overallEmotion.neutral = parseFloat(((overallEmotion.neutral / overallEmotion.eTotal) * 100).toFixed(2))
    overallEmotion.angry = parseFloat(((overallEmotion.angry / overallEmotion.eTotal) * 100).toFixed(2))
    overallEmotion.evalence = parseFloat((overallEmotion.evalence / returnEmotionData.length).toFixed(3))
    overallEmotion.arousal = parseFloat((overallEmotion.arousal / returnEmotionData.length).toFixed(3))
    overallEmotion.attention = parseFloat((overallEmotion.attention / returnEmotionData.length).toFixed(3))
    overallEmotion.disgust = parseFloat(((overallEmotion.disgust / overallEmotion.eTotal) * 100).toFixed(2))
  }

  var overAll = { ...overallEmotion }
  delete overAll.eTotal

  return overAll
}

function divideIntoMinutes (graphData) {
  var currentMinute = 1
  var tempGraphObject = { // Reset object and start accumulating again
    time: currentMinute,
    neutral: graphData[0].neutral,
    happy: graphData[0].happy,
    sad: graphData[0].sad,
    angry: graphData[0].angry,
    surprised: graphData[0].surprised,
    scare: graphData[0].scare,
    disgust: graphData[0].disgust,
    evalence: graphData[0].evalence,
    engagement: graphData[0].engagement,
    arousal: graphData[0].arousal,
    attention: graphData[0].attention,
    // valence: graphData[0].valence,
    metricValence: graphData[0].metricValence,
    count: graphData[0].count,
    eTotal: graphData[0].eTotal
  }
  var tempLength = 1 // This will be needed if the last segment is < 60 seconds
  var minuteGraph = []
  for (var i = 1; i < graphData.length; i++) {
    if (i === graphData.length - 1) { // Reached the end
      // Add last second
      tempGraphObject.neutral += graphData[i].neutral
      tempGraphObject.happy += graphData[i].happy
      tempGraphObject.sad += graphData[i].sad
      tempGraphObject.angry += graphData[i].angry
      tempGraphObject.surprised += graphData[i].surprised
      tempGraphObject.scare += graphData[i].scare
      tempGraphObject.disgust += graphData[i].disgust
      tempGraphObject.evalence += graphData[i].evalence
      tempGraphObject.engagement += graphData[i].engagement
      tempGraphObject.arousal += graphData[i].arousal
      tempGraphObject.attention += graphData[i].attention
      //  tempGraphObject.valence += graphData[i].valence
      tempGraphObject.metricValence += graphData[i].metricValence

      tempGraphObject.count += graphData[i].count
      tempGraphObject.eTotal += graphData[i].eTotal
      tempLength++

      // Get average for segment
      tempGraphObject.neutral = tempGraphObject.neutral / tempLength
      tempGraphObject.happy = tempGraphObject.happy / tempLength
      tempGraphObject.sad = tempGraphObject.sad / tempLength
      tempGraphObject.angry = tempGraphObject.angry / tempLength
      tempGraphObject.surprised = tempGraphObject.surprised / tempLength
      tempGraphObject.scare = tempGraphObject.scare / tempLength
      tempGraphObject.disgust = tempGraphObject.disgust / tempLength
      tempGraphObject.evalence = tempGraphObject.evalence / tempLength
      tempGraphObject.engagement = tempGraphObject.engagement / tempLength
      tempGraphObject.arousal = tempGraphObject.arousal / tempLength
      tempGraphObject.attention = tempGraphObject.attention / tempLength
      //  tempGraphObject.valence = tempGraphObject.valence / tempLength
      tempGraphObject.metricValence = tempGraphObject.metricValence / tempLength

      tempGraphObject.count = tempGraphObject.count / tempLength
      tempGraphObject.eTotal = tempGraphObject.eTotal / tempLength

      // Push
      minuteGraph.push(tempGraphObject)
    } else if (i % 60 === 0) { // End of segment
      // Get average for segment
      tempGraphObject.neutral = tempGraphObject.neutral / tempLength
      tempGraphObject.happy = tempGraphObject.happy / tempLength
      tempGraphObject.sad = tempGraphObject.sad / tempLength
      tempGraphObject.angry = tempGraphObject.angry / tempLength
      tempGraphObject.surprised = tempGraphObject.surprised / tempLength
      tempGraphObject.scare = tempGraphObject.scare / tempLength
      tempGraphObject.disgust = tempGraphObject.disgust / tempLength
      tempGraphObject.evalence = tempGraphObject.evalence / tempLength
      tempGraphObject.engagement = tempGraphObject.engagement / tempLength
      tempGraphObject.arousal = tempGraphObject.arousal / tempLength
      tempGraphObject.attention = tempGraphObject.attention / tempLength

      //   tempGraphObject.valence = tempGraphObject.valence / tempLength
      tempGraphObject.metricValence = tempGraphObject.metricValence / tempLength

      tempGraphObject.count = tempGraphObject.count / tempLength
      tempGraphObject.eTotal = tempGraphObject.eTotal / tempLength

      minuteGraph.push(tempGraphObject) // Add previous minute data to graph

      currentMinute++ // Move to next minute
      tempLength = 1 // Reset segment tick
      tempGraphObject = { // Reset object and start accumulating again
        time: currentMinute,
        neutral: graphData[i].neutral,
        happy: graphData[i].happy,
        sad: graphData[i].sad,
        angry: graphData[i].angry,
        surprised: graphData[i].surprised,
        scare: graphData[i].scare,
        disgust: graphData[i].disgust,
        evalence: graphData[i].evalence,
        engagement: graphData[i].engagement,
        arousal: graphData[i].arousal,

        attention: graphData[i].attention,
        //    valence: graphData[i].valence,
        metricValence: graphData[i].metricValence,

        count: graphData[i].count,
        eTotal: graphData[i].eTotal
      }
    } else { // Building temp graph object
      tempGraphObject.neutral += graphData[i].neutral
      tempGraphObject.happy += graphData[i].happy
      tempGraphObject.sad += graphData[i].sad
      tempGraphObject.angry += graphData[i].angry
      tempGraphObject.surprised += graphData[i].surprised
      tempGraphObject.scare += graphData[i].scare
      tempGraphObject.disgust += graphData[i].disgust
      tempGraphObject.evalence += graphData[i].evalence
      tempGraphObject.engagement += graphData[i].engagement
      tempGraphObject.arousal += graphData[i].arousal
      tempGraphObject.attention += graphData[i].attention

      //  tempGraphObject.valence += graphData[i].valence
      tempGraphObject.metricValence += graphData[i].metricValence

      tempGraphObject.count += graphData[i].count
      tempGraphObject.eTotal += graphData[i].eTotal
      tempLength++
    }
  }

  return minuteGraph
}

exports.getEmotions = async (req, res) => {
    if (!req.query.cnt_id || isNaN(req.query.cnt_id)) {
        return res.status(200).send({
          error: false,
          code: 400,
          message: 'Content ID required and must be a number',
          response: []
        })
      }
    
      // Programmatically build query to include optional filters
      var query = {
        cnt_id: req.query.cnt_id
      }
    
      if (req.query.gender) {
        if (req.query.gender === 'm') {
          query.gender = 1
        } else if (req.query.gender === 'f') {
          query.gender = 2
        } else if (req.query.gender === 'mf') { query.gender = { $in: [1, 2] } }
      }
    
      if (req.query.age_range) {
        var startRanges = req.query.age_range.split(',')
        var ranges = []
        for (var x = 0; x < startRanges.length; x++) {
          var splitRanges = (startRanges[x].split('-'))
          ranges = ranges.concat(splitRanges)
        }
    
        if (ranges.length % 2 !== 0) {
          return res.status(200).send({
            error: false,
            code: 400,
            message: 'Must have an even amount of ages',
            response: []
          })
        }
        var queryRanges = []
        var count = 1
    
        for (var x = 0; x < ranges.length; x++) {
          if (x < ranges.length - 1) {
            queryRanges.push({ age: { $gte: ranges[x], $lte: ranges[x + count] } })
          }
          x++
        }
        query.$or = queryRanges
      }
    
      if (req.query.cc) {
        var ccType = 'consumers'
        if (req.query.cc === 'non_consumer') {
          ccType = 'nonconsumers'
        }
        var users = await new Promise(resolve => {
          resolve(customImageHelper.loadUsers(req.query.cnt_id, ccType))
        })
        query.wh_mo_id = users
      }
    
      if (req.query.slag) {
        const slags = req.query.slag.split(',')
        const cohorts = await AdditionalCohorts.find({ cnt_id: req.query.cnt_id, slag: { $in: slags } }).lean()
    
        var userIdLists = []
        if (cohorts.length > 0) {
          cohorts.forEach((cohort) => {
            userIdLists.push(cohort.wh_mo_ids)
          })
        }
    
        if (req.query.user_ids) {
          userIdLists.push(req.query.user_ids.split(','))
        }
    
        const userIds = getUniqueUserIds(userIdLists).unique()
    
        query.wh_mo_id = {
          $in: userIds
        }
      } else if (req.query.user_ids) {
        query.wh_mo_id = {
          $in: req.query.user_ids.split(',')
        }
      }
    
      // Pass through the emotion intensity filter
      function passThrough (query, callback) {
        callback(null, query)
      }


      var emoting = null
      if (req.query.emoting) {
        emoting = req.query.emoting
      }

       // Query each collection
    async.parallel({
      content: function (cb) {
        Content.findOne({ cnt_id: req.query.cnt_id }, (_err, result) => {
          cont = result
          cb(null, result)
        })
        id = req.query.cnt_id
      },
      reactionEmotionData: function (cb) {
        ReactionEmotionData.find(query, {
        wh_mo_id: 1,
          'emotion_data.ed_time': 1,
          'emotion_data.ed_happy': 1,
          'emotion_data.ed_valence': 1,
          'emotion_data.ed_suprised': 1,
          'emotion_data.ed_angry': 1,
          'emotion_data.ed_sad': 1,
          'emotion_data.ed_scared': 1,
          'emotion_data.ed_disgusted': 1,
          'emotion_data.ed_neutral': 1
  
        },(_err, result) => { rED = result; cb(null, result) }).lean()
      },
      emoting: passThrough.bind(null, req.query.emoting)
    },
    (err,results)=>{
            if (err) {
                return res.status(200).send({
                  error: false,
                  code: 500,
                  message: 'Error retrieving content details',
                  response: []
                })
              }
              if (!results.content && results.reactionEmotionData.length <= 0 && results.heatMapData.length <= 0) {
                return res.status(200).send({
                  error: false,
                  code: 404,
                  message: 'No data found for content with ID ' + req.query.cnt_id,
                  response: []
                })
              }
              // var emotion_user_ids = []
              // var reaction_user_ids = []
              // for (let i = 0; i < results.reactionEmotionData.length; i++) {
              //   if (results.reactionEmotionData[i].emotion_data.length === 0) {
              //     reaction_user_ids.push(results.reactionEmotionData[i].wh_mo_id)
              //   } else {
              //     emotion_user_ids.push(results.reactionEmotionData[i].wh_mo_id)
              //   }
              // }

              var errors = []
              var returnGraphData = [] // The final emotion object
              var returnEmotionData = [] // Emotion data separated
          
              function addExtremes (finalExtremes, returnGraphData, key, type) {
                for (var i = 0; i < finalExtremes[type][key].peaks.length; i++) {
                  var timeIndex = returnGraphData.findIndex(obj => obj.time === finalExtremes[type][key].peaks[i])
                  // console.log(timeIndex)
                  if (timeIndex !== -1) {
                    var newKey = key + 'Peak'
                    returnGraphData[timeIndex][newKey] = 1
                  }
                }
          
                for (var i = 0; i < finalExtremes[type][key].valleys.length; i++) {
                  var timeIndex = returnGraphData.findIndex(obj => obj.time === finalExtremes[type][key].valleys[i])
                  // console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
                  // console.log(timeIndex)
                  if (timeIndex !== -1) {
                    if (!returnGraphData[timeIndex][key + 'Peak']) {
                      var newKey = key + 'Peak'
                      returnGraphData[timeIndex][newKey] = 1
                    }
                  }
                }
              }


              if (results.reactionEmotionData.length > 0){
                          // TODO: Determine good levels for high/medium low.
        // For now: high => absolute_value(valence) > 0.75
        // medium => 0.75 >= absolute_value(valence) >= 0.25
        // low => absolute_value(valence) < 0.25
        if (results.emoting === 'high' || results.emoting === 'medium' || results.emoting === 'low') {
            var qualifiedUsers = []
            // First we check if there is a valid emoting parameter so we know we need to get each user's average
            for (var i = 0; i < results.reactionEmotionData.length; i++) {
              var valenceAverage = 0
              // Each user
              for (var j = 0; j < results.reactionEmotionData[i].emotion_data.length; j++) {
                // Loop through this user's emotions
                valenceAverage += results.reactionEmotionData[i].emotion_data[j].ed_valence
              }
              if (results.reactionEmotionData[i].emotion_data.length > 0) {
                valenceAverage = valenceAverage / results.reactionEmotionData[i].emotion_data.length
                if (results.emoting === 'high') {
                  if (Math.abs(valenceAverage) > 0.75) {
                    qualifiedUsers.push(results.reactionEmotionData[i].wh_mo_id)
                  }
                } else if (results.emoting === 'medium') {
                  if (Math.abs(valenceAverage) >= 0.25 && Math.abs(valenceAverage) <= 0.75) {
                    qualifiedUsers.push(results.reactionEmotionData[i].wh_mo_id)
                  }
                } else if (results.emoting === 'low') {
                  if (Math.abs(valenceAverage) < 0.25) {
                    qualifiedUsers.push(results.reactionEmotionData[i].wh_mo_id)
                  }
                }
              }
            }
            // Now we have the qualified users, so we can filter the heatmap and emotion_reaction data
            // Filter reactions and heatmap data
            results.reactionEmotionData = results.reactionEmotionData.filter(f => qualifiedUsers.includes(f.wh_mo_id))
          }

          try {
            var emotions = results.reactionEmotionData.map(a => a.emotion_data)
            if (emotions.length <= 0) {
              errors.push('No emotions data')
            }
    
            var contentLength = 0
            try {
              contentLength = Math.floor(results.content.cnt_length) + 1
            } catch (e) {
              var maxTime = 0
              var maxEmotion = 0
            //   var maxReaction = 0
              // No length variable so we need to create one from the max of emotion and reaction documents
              // Math.max.apply(Math, returnEmotionData.map(function (o) { return o.happy }))
              for (var i = 0; i < results.reactionEmotionData.length; i++) {
                // Check emotion data
                maxEmotion = Math.max.apply(Math, results.reactionEmotionData[i].emotion_data.map(function (o) { return o.ed_time }))
                maxTime = Math.max(maxTime, maxEmotion)
                // Check reaction data
                // for (var j = 0; j < results.reactionEmotionData[i].reaction_data.length; j++) {
                //   if (results.reactionEmotionData[i].reaction_data[j].comment.length > 0) {
                //     maxReaction = Math.max.apply(Math, results.reactionEmotionData[i].reaction_data[j].comment.map(function (o) { return o.rd_time }))
                //     maxTime = Math.max(maxTime, maxReaction)
                //   }
                // }
              }
              contentLength = maxTime + 1
            }
    
            // Create combined emotion and reaction array
            for (var startEmotionIndex = 0; startEmotionIndex < contentLength; startEmotionIndex++) {
              returnGraphData.push({
                time: startEmotionIndex,
                neutral: 0,
                happy: 0,
                sad: 0,
                angry: 0,
                surprised: 0,
                scare: 0,
                disgust: 0,
                evalence: 0,
                engagement: 0,
                arousal: 0,
                // valence: 0,
                count: 0,
                eTotal: 0,
                valenceArray: [],
                metricValence: 0
              })
            }
    
            for (var i = 0; i < results.reactionEmotionData.length; i++) {
              for (var j = 0; j < results.reactionEmotionData[i].emotion_data.length; j++) {
                if (results.reactionEmotionData[i].emotion_data[j].ed_time === 147) {
                }
              }
            }
    
            for (var i = 0; i < emotions.length; i++) {
              for (var j = 0; j < emotions[i].length && j < contentLength - 1; j++) {
                var index = returnGraphData.findIndex(obj => obj.time === emotions[i][j].ed_time)
                var valenceData = Math.max(emotions[i][j].ed_happy, emotions[i][j].ed_suprised) -
                  Math.max(emotions[i][j].ed_angry, emotions[i][j].ed_sad, emotions[i][j].ed_scared, emotions[i][j].ed_disgusted)
                returnGraphData[index].evalence += valenceData
                returnGraphData[index].neutral += emotions[i][j].ed_neutral
                returnGraphData[index].happy += emotions[i][j].ed_happy
                returnGraphData[index].sad += emotions[i][j].ed_sad
                returnGraphData[index].angry += emotions[i][j].ed_angry
                returnGraphData[index].surprised += emotions[i][j].ed_suprised
                returnGraphData[index].scare += emotions[i][j].ed_scared
                returnGraphData[index].disgust += emotions[i][j].ed_disgusted
                returnGraphData[index].count++
    
                // For calculating percentages
                returnGraphData[index].eTotal += (emotions[i][j].ed_disgusted + emotions[i][j].ed_scared + emotions[i][j].ed_happy +
                    emotions[i][j].ed_suprised + emotions[i][j].ed_angry + emotions[i][j].ed_sad + emotions[i][j].ed_neutral)
    
                // For the final valence total
                returnGraphData[index].valenceArray.push(valenceData)
              }
            }
    
            for (var k = 0; k < returnGraphData.length; k++) {
              if (returnGraphData[k].count > 0) {
                returnGraphData[k].neutral = returnGraphData[k].neutral / returnGraphData[k].count
                returnGraphData[k].sad = returnGraphData[k].sad / returnGraphData[k].count
                returnGraphData[k].happy = returnGraphData[k].happy / returnGraphData[k].count
                returnGraphData[k].scare = returnGraphData[k].scare / returnGraphData[k].count
                returnGraphData[k].angry = returnGraphData[k].angry / returnGraphData[k].count
                returnGraphData[k].disgust = returnGraphData[k].disgust / returnGraphData[k].count
                returnGraphData[k].surprised = returnGraphData[k].surprised / returnGraphData[k].count
                returnGraphData[k].evalence = returnGraphData[k].evalence / returnGraphData[k].count
                returnGraphData[k].eTotal = returnGraphData[k].eTotal / returnGraphData[k].count
    
                // Get metric valence
                var standardDeviation = Math.std(returnGraphData[k].valenceArray)
                // console.log('************************************************************')
                // console.log(standardDeviation)
                returnGraphData[k].valenceArray = returnGraphData[k].valenceArray.filter(n => n < returnGraphData[k].evalence - (2 * standardDeviation) || n > returnGraphData[k].evalence - (2 * standardDeviation))
                returnGraphData[k].metricValence = returnGraphData[k].valenceArray.reduce((a, b) => a + b, 0) / returnGraphData[k].valenceArray.length
                // console.log('+++++++++++++++++++++++++++++++')
                // console.log(returnGraphData[k].valenceArray)
                // console.log('____________________________________________')
                // console.log( returnGraphData[k].metricValence)
    
    
                delete returnGraphData[k].valenceArray
              }
            }
          } catch (e) {
            console.log(e)
            errors.push('Error parsing emotion data')
          }

          try{
                // eslint-disable-next-line no-undef
        var overAll

        // eslint-disable-next-line camelcase
        var Graph_min_sec

        // const sec = req.query.second

        if (req.query.minute == 1) {
          // eslint-disable-next-line camelcase
          Graph_min_sec = divideIntoMinutes(returnGraphData)

          overAll = retrieveOverallReaction3(results, errors, Graph_min_sec)
        } else {
          // eslint-disable-next-line camelcase
          Graph_min_sec = returnGraphData

          overAll = retrieveOverallReaction3(results, errors, returnGraphData)
        }
        var finalExtremes = reactionEmotionExtremes3(returnGraphData)

                // neutral
                addExtremes(finalExtremes, Graph_min_sec, 'neutral', 'emotion')
                // sad
                addExtremes(finalExtremes, Graph_min_sec, 'sad', 'emotion')
                // happy
                addExtremes(finalExtremes, Graph_min_sec, 'happy', 'emotion')
                // scare
                addExtremes(finalExtremes, Graph_min_sec, 'scare', 'emotion')
                // angry
                addExtremes(finalExtremes, Graph_min_sec, 'angry', 'emotion')
                // disgust
                addExtremes(finalExtremes, Graph_min_sec, 'disgust', 'emotion')
                // surprised
                addExtremes(finalExtremes, Graph_min_sec, 'surprised', 'emotion')
                // evalence
                addExtremes(finalExtremes, Graph_min_sec, 'evalence', 'emotion')


          } catch (e) {
            console.log(e)
            errors.push('Error parsing emotion data')
          }
              }else { // No reaction data found
                errors.push('Reaction_emotion document not found')
              }

              
    var returnData = {
        graph_data: setDefaultValue(Graph_min_sec, []),
        overall: setDefaultValue(overAll, {})
      }
      async.forEachSeries([1], function (item, callback) {
        var bol
        var temp = 0
        var sss
        async function abc (results) {
          // eslint-disable-next-line no-return-await
  
          // var tt = await to_SalientScene(results)
          // var result = await resolveAfter2Seconds();
          //  console.log(result);
          //  console.log(JSON.parse(JSON.stringify(tt)) + 'ccccccccccccc')
  
          return {}
        }
        abc(results).then((data) => {
          // sss = data
          returnData.graph_data.forEach(item1 => {
            temp = temp + item1.neutral +
            item1.happy + item1.sad +
            item1.angry + item1.surprised +
            item1.scare + item1.disgust +
            item1.evalence + item1.engagement +
            item1.arousal + item1.count +
            item1.eTotal
          })
  
          if (temp === 0 || temp === '0') {
            returnData.graph_data = []
            return res.status(200).send({
              error: false,
              code: 200,
              message: 'data not found',
              response: []
            })
          } else {
            // returnData.salient_scenes = sss.content_summaries
            return res.status(200).send({
              error: false,
              code: 200,
              message: 'Successfully retrieved graph data',
              response: returnData
            })
          }
        })
        callback()
      })
     })
}
