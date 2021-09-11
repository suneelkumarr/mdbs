
const Content = require('../../models/content.model')
const ReactionEmotionData = require('../../models/reactionEmotionData.model')
const salientSceneController = require('../salient-scene.controller')
const async = require('async')
const customImageHelper = require('../custom_image_helper.js')
const AdditionalCohorts = require('../../models/custom_cohort.model')


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
  
  const Math = require('mathjs')
const { validate, removeAllListeners } = require('../../models/reactionEmotionData.model')
const { response } = require('express')
  function divideIntoMinutes (graphData) {
    var currentMinute = 1
    var tempGraphObject = {
  
      // Reset object and start accumulating again
      time: currentMinute,
  
      like: graphData[0].like,
      love: graphData[0].love,
      want: graphData[0].want,
      memorable: graphData[0].memorable,
      boring: graphData[0].boring,
      dislike: graphData[0].dislike,
      confusing: graphData[0].confusing,
      engaging: graphData[0].engaging,
      informative: graphData[0].informative,
      misleading: graphData[0].misleading,
      accurate: graphData[0].accurate,
      valence: graphData[0].valence
  
    }
    var tempLength = 1 // This will be needed if the last segment is < 60 seconds
    var minuteGraph = []
    for (var i = 1; i < graphData.length; i++) {
      if (i === graphData.length - 1) { // Reached the end
        // Add last second
  
        tempGraphObject.like += graphData[i].like
        tempGraphObject.love += graphData[i].love
        tempGraphObject.want += graphData[i].want
        tempGraphObject.memorable += graphData[i].memorable
        tempGraphObject.boring += graphData[i].boring
        tempGraphObject.dislike += graphData[i].dislike
        tempGraphObject.confusing += graphData[i].confusing
        tempGraphObject.engaging += graphData[i].engaging
        tempGraphObject.informative += graphData[i].informative
        tempGraphObject.misleading += graphData[i].misleading
        tempGraphObject.accurate += graphData[i].accurate
        tempGraphObject.valence += graphData[i].valence
  
        tempLength++
  
        // Get average for segment
  
        tempGraphObject.like = tempGraphObject.like / tempLength
        tempGraphObject.love = tempGraphObject.love / tempLength
        tempGraphObject.want = tempGraphObject.want / tempLength
        tempGraphObject.memorable = tempGraphObject.memorable / tempLength
        tempGraphObject.boring = tempGraphObject.boring / tempLength
        tempGraphObject.dislike = tempGraphObject.dislike / tempLength
        tempGraphObject.confusing = tempGraphObject.confusing / tempLength
        tempGraphObject.engaging = tempGraphObject.engaging / tempLength
        tempGraphObject.misleading = tempGraphObject.misleading / tempLength
        tempGraphObject.informative = tempGraphObject.informative / tempLength
        tempGraphObject.accurate = tempGraphObject.accurate / tempLength
        tempGraphObject.valence = tempGraphObject.valence / tempLength
  
        // Push
        minuteGraph.push(tempGraphObject)
      } else if (i % 60 === 0) { // End of segment
        // Get average for segment
  
        tempGraphObject.like = tempGraphObject.like / tempLength
        tempGraphObject.love = tempGraphObject.love / tempLength
        tempGraphObject.want = tempGraphObject.want / tempLength
        tempGraphObject.memorable = tempGraphObject.memorable / tempLength
        tempGraphObject.boring = tempGraphObject.boring / tempLength
        tempGraphObject.dislike = tempGraphObject.dislike / tempLength
        tempGraphObject.confusing = tempGraphObject.confusing / tempLength
        tempGraphObject.engaging = tempGraphObject.engaging / tempLength
        tempGraphObject.informative = tempGraphObject.informative / tempLength
        tempGraphObject.misleading = tempGraphObject.misleading / tempLength
        tempGraphObject.accurate = tempGraphObject.accurate / tempLength
        tempGraphObject.valence = tempGraphObject.valence / tempLength
  
        minuteGraph.push(tempGraphObject) // Add previous minute data to graph
  
        currentMinute++ // Move to next minute
        tempLength = 1 // Reset segment tick
        tempGraphObject = { // Reset object and start accumulating again
          time: currentMinute,
  
          like: graphData[i].like,
          love: graphData[i].love,
          want: graphData[i].want,
          memorable: graphData[i].memorable,
          boring: graphData[i].boring,
          dislike: graphData[i].dislike,
          confusing: graphData[i].confusing,
          engaging: graphData[i].engaging,
          informative: graphData[i].informative,
          misleading: graphData[i].misleading,
          accurate: graphData[i].accurate,
          valence: graphData[i].valence
  
        }
      } else { // Building temp graph object
        tempGraphObject.like += graphData[i].like
        tempGraphObject.love += graphData[i].love
        tempGraphObject.want += graphData[i].want
        tempGraphObject.memorable += graphData[i].memorable
        tempGraphObject.boring += graphData[i].boring
        tempGraphObject.dislike += graphData[i].dislike
        tempGraphObject.confusing += graphData[i].confusing
        tempGraphObject.engaging += graphData[i].engaging
        tempGraphObject.informative += graphData[i].informative
        tempGraphObject.misleading += graphData[i].misleading
        tempGraphObject.accurate += graphData[i].accurate
        tempGraphObject.valence += graphData[i].valence
  
        tempLength++
      }
    }
  
    return minuteGraph
  }
  function setDefaultValue (value, defaultValue) {
    try {
      return (value === undefined) ? defaultValue : value
    } catch (e) {
      return defaultValue
    }
  }


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
  
  // Get 6 peaks and valleys for a reaction
  var getReactionPeaksAndValleys = (reactionDataObj, reaction) => {
    try {
      var reactionData = reactionDataObj
      var peaksList = []
      var valleysList = []
  
      // We will continuously reduce this as we get peaks
      var reactionGraphPositive = reactionData
      // We will continuously reduce this as we get valleys
      var reactionGraphNegative = reactionData
  
      // This may differ from the content's actual length,
      // but we need to work with what emotion data is available
      var contentReactionLength = Math.floor(Math.max.apply(Math, reactionData.map(function (o) { return o.time })))
  
      // This is the length to the left and right of the max that we use to prevent peaks
      // being too close together
      var barrierRadius = Math.floor(contentReactionLength * 0.1)
  
      // Positive
      // Get peaks, the number of peaks can change
      for (var peakIndex = 0; peakIndex < 3; peakIndex++) {
        if (reactionGraphPositive.length > 0) {
          // Get peak
          var peakObj = reactionGraphPositive.reduce((max, obj) => max[reaction] > obj[reaction] ? max : obj)
          // Push to list
          peaksList.push(peakObj.time)
  
          // Set up barrier so we don't get any more peaks from this area
  
          // Remove this barrier range from data so we don't use it again
          reactionGraphPositive = reactionGraphPositive.filter(obj => obj.time < peakObj.time - barrierRadius || obj.time > peakObj.time + barrierRadius)
        } else {
          break
        }
      }
  
      // Get valleys
      for (var valleyIndex = 0; valleyIndex < 3; valleyIndex++) {
        if (reactionGraphNegative.length > 0) {
          // Get valley
          var valleyObject = reactionGraphNegative.reduce((min, obj) => min[reaction] < obj[reaction] ? min : obj)
          // Push to list
          valleysList.push(valleyObject.time)
  
          // Remove this from data so we don't use it again
          reactionGraphNegative = reactionGraphNegative.filter(obj => obj.time < valleyObject.time - barrierRadius || obj.time > valleyObject.time + barrierRadius)
        } else {
          break
        }
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
  
  function reactionEmotionExtremes (returnGraphData) {
    // var emotionExtremes = {
    //   neutral: getEmotionPeaksAndValleys(returnGraphData, 'neutral'),
    //   sad: getEmotionPeaksAndValleys(returnGraphData, 'sad'),
    //   happy: getEmotionPeaksAndValleys(returnGraphData, 'happy'),
    //   scare: getEmotionPeaksAndValleys(returnGraphData, 'scare'),
    //   angry: getEmotionPeaksAndValleys(returnGraphData, 'angry'),
    //   disgust: getEmotionPeaksAndValleys(returnGraphData, 'disgust'),
    //   surprised: getEmotionPeaksAndValleys(returnGraphData, 'surprised'),
    //   evalence: getEmotionPeaksAndValleys(returnGraphData, 'evalence')
  
    // }
  
    var reactionExtremes = {
      valence: getReactionPeaksAndValleys(returnGraphData, 'valence'),
      like: getReactionPeaksAndValleys(returnGraphData, 'like'),
      love: getReactionPeaksAndValleys(returnGraphData, 'love'),
      want: getReactionPeaksAndValleys(returnGraphData, 'want'),
      memorable: getReactionPeaksAndValleys(returnGraphData, 'memorable'),
      boring: getReactionPeaksAndValleys(returnGraphData, 'boring'),
      dislike: getReactionPeaksAndValleys(returnGraphData, 'dislike'),
      confusing: getReactionPeaksAndValleys(returnGraphData, 'confusing'),
      engaging: getReactionPeaksAndValleys(returnGraphData, 'engaging'),
      informative: getReactionPeaksAndValleys(returnGraphData, 'informative'),
      misleading: getReactionPeaksAndValleys(returnGraphData, 'misleading'),
      accurate: getReactionPeaksAndValleys(returnGraphData, 'accurate')
    }
  
    var extremes = {
      reaction: reactionExtremes,
    //   emotion: emotionExtremes
    }
  
    return extremes
  }
  function retrieveOverallReaction2 (results, _errors, returnEmotionData) {
    var reactionDict = {
      1: 'like',
      2: 'love',
      3: 'want',
      4: 'memorable',
      5: 'boring',
      6: 'dislike',
      7: 'confusing',
      8: 'engaging',
      9: 'misleading',
      10: 'accurate',
      11: 'informative'
    }
  
    var overallReaction = {
  
      like: 0,
      love: 0,
      want: 0,
      memorable: 0,
      boring: 0,
      dislike: 0,
      confusing: 0,
      engaging: 0,
      informative: 0,
      misleading: 0,
      accurate: 0,
      valence: 0,
      total: 0
    }
  
    var reactions2 = []
  
    for (var x = 0; x < results.reactionEmotionData.length; x++) {
      reactions2.push({
        reactionInfo: results.reactionEmotionData[x].reaction_data,
        age: results.reactionEmotionData[x].age,
        gender: results.reactionEmotionData[x].gender
      })
    }
  
    // Iterate the reactionEmotion data only
    reactions2.forEach(function (reaction) {
      for (var i = 0; i < reaction.reactionInfo.length; i++) {
        if (reaction.reactionInfo[i].comment.length > 0) {
          // console.log(reaction.reactionInfo[i].comment)
          for (var j = 0; j < reaction.reactionInfo[i].comment.length; j++) {
            // iterate through the users, type and comments to store the comment data by second
  
            overallReaction[reactionDict[reaction.reactionInfo[i].rd_type]] += 1
            overallReaction.total += 1
          }
        }
      }
    })
  
    overallReaction.valence = parseFloat(((((overallReaction.like + overallReaction.memorable + overallReaction.want) - (overallReaction.dislike + overallReaction.boring)) / reactions2.length)).toFixed(3))
  
    overallReaction.like = parseFloat(((overallReaction.like / overallReaction.total) * 100).toFixed(2))
    overallReaction.love = parseFloat(((overallReaction.love / overallReaction.total) * 100).toFixed(2))
    overallReaction.want = parseFloat(((overallReaction.want / overallReaction.total) * 100).toFixed(2))
    overallReaction.memorable = parseFloat(((overallReaction.memorable / overallReaction.total) * 100).toFixed(2))
    overallReaction.boring = parseFloat(((overallReaction.boring / overallReaction.total) * 100).toFixed(2))
    overallReaction.dislike = parseFloat(((overallReaction.dislike / overallReaction.total) * 100).toFixed(2))
    overallReaction.confusing = parseFloat(((overallReaction.confusing / overallReaction.total) * 100).toFixed(2))
    overallReaction.misleading = parseFloat(((overallReaction.misleading / overallReaction.total) * 100).toFixed(2))
    overallReaction.accurate = parseFloat(((overallReaction.accurate / overallReaction.total) * 100).toFixed(2))
    overallReaction.engaging = parseFloat(((overallReaction.engaging / overallReaction.total) * 100).toFixed(2))
    overallReaction.informative = parseFloat(((overallReaction.informative / overallReaction.total) * 100).toFixed(2))
  
    var overAll = { ...overallReaction }
  
    return overAll
  }


  exports.getReactionData = async (req, res) => {
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
    // id=req.query.cnt_id;
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
  
    if (req.query.user_ids) {
      var users = req.query.user_ids.split(',')
      query.wh_mo_id = {
        $in: users
      }
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
  
    // Query each collection
  
    // eslint-disable-next-line no-undef
    async.parallel({
      content: function (cb) {
        // eslint-disable-next-line no-undef
        Content.findOne({ cnt_id: req.query.cnt_id }, (_err, result) => {
          cb(null, result)
        })
      },
      reactionEmotionData: function (cb) {
        // eslint-disable-next-line no-undef
        ReactionEmotionData.find(query, { reaction_data: 1 }, (_err, result) => { rED = result; cb(null, result) }).lean()
      },
      emoting: passThrough.bind(null, req.query.emoting)
    }, function (err, results) { // Parse all results
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
  
      // console.log(results.query)
      var errors = []
      var returnGraphData = [] // The final emotion object
  
      function addExtremes (finalExtremes, returnGraphData, key, type) {
        for (var i = 0; i < finalExtremes[type][key].peaks.length; i++) {
          var timeIndex = returnGraphData.findIndex(obj => obj.time === finalExtremes[type][key].peaks[i])
          if (timeIndex !== -1) {
            var newKey = key + 'Peak'
            returnGraphData[timeIndex][newKey] = 1
          }
        }
  
        for (var i = 0; i < finalExtremes[type][key].valleys.length; i++) {
          var timeIndex = returnGraphData.findIndex(obj => obj.time === finalExtremes[type][key].valleys[i])
          if (timeIndex !== -1) {
            if (!returnGraphData[timeIndex][key + 'Peak']) {
              var newKey = key + 'Peak'
              returnGraphData[timeIndex][newKey] = 1
            }
          }
        }
      }
  
      if (results.reactionEmotionData.length > 0) {
        if (results.emoting === 'high' || results.emoting === 'medium' || results.emoting === 'low') {
          var qualifiedUsers = []
  
          // Now we have the qualified users, so we can filter the heatmap and emotion_reaction data
          // Filter reactions and heatmap data
          results.reactionEmotionData = results.reactionEmotionData.filter(f => qualifiedUsers.includes(f.wh_mo_id))
        }
        try {
          // var emotions = results.reactionEmotionData.map(a => a.emotion_data)
          // if (emotions.length <= 0) {
          //   errors.push('No emotions data')
          // }
  
          var contentLength = 0
          try {
            contentLength = Math.floor(results.content.cnt_length) + 1
          } catch (e) {
            var maxTime = 0
            // var maxEmotion = 0
            var maxReaction = 0
            // No length variable so we need to create one from the max of emotion and reaction documents
            // Math.max.apply(Math, returnEmotionData.map(function (o) { return o.happy }))
            for (var i = 0; i < results.reactionEmotionData.length; i++) {
              // Check emotion data
              // --------------------------------
              // maxEmotion = Math.max.apply(Math, results.reactionEmotionData[i].emotion_data.map(function (o) { return o.ed_time }))
              // maxTime = Math.max(maxTime, maxEmotion)
              // Check reaction data
  
              for (var j = 0; j < results.reactionEmotionData[i].reaction_data.length; j++) {
                if (results.reactionEmotionData[i].reaction_data[j].comment.length > 0) {
                  maxReaction = Math.max.apply(Math, results.reactionEmotionData[i].reaction_data[j].comment.map(function (o) { return o.rd_time }))
                  maxTime = Math.max(maxTime, maxReaction)
                }
              }
            }
            contentLength = maxTime + 1
          }
  
          // Create combined emotion and reaction array
          for (var startEmotionIndex = 0; startEmotionIndex < contentLength; startEmotionIndex++) {
            returnGraphData.push({
              time: startEmotionIndex,
              like: 0,
              love: 0,
              want: 0,
              memorable: 0,
              boring: 0,
              dislike: 0,
              confusing: 0,
              engaging: 0,
              misleading: 0,
              accurate: 0,
              informative: 0
  
            })
          }
        } catch (e) {
          console.log(e)
          errors.push('Error parsing emotion data')
        }
        try {
          // Reaction data parsing
  
          // Dictionary assosicating type number to text values
          var reactionDict = {
            1: 'like',
            2: 'love',
            3: 'want',
            4: 'memorable',
            5: 'boring',
            6: 'dislike',
            7: 'confusing',
            8: 'engaging',
            9: 'misleading',
            10: 'accurate',
            11: 'informative'
          }
  
          // Two arrays to store the comment array and reaction data to be stored in the end
          // var commentData = [] // Comment data will now be separate
          // var wordCloudData = [] // For now we are excluding word cloud data
          var reactions2 = []
  
          for (var x = 0; x < results.reactionEmotionData.length; x++) {
            reactions2.push({
              reactionInfo: results.reactionEmotionData[x].reaction_data,
              age: results.reactionEmotionData[x].age,
              gender: results.reactionEmotionData[x].gender
            })
          }
  
          if (reactions2.length <= 0) {
            errors.push('No reactions data')
          }
  
          // Iterate the reactionEmotion data only
          reactions2.forEach(function (reaction) {
            for (var i = 0; i < reaction.reactionInfo.length; i++) {
              if (reaction.reactionInfo[i].comment.length > 0) {
                for (var j = 0; j < reaction.reactionInfo[i].comment.length; j++) {
                  // Grouping each reaction by second
                  // Find the time in seconds in the array
                  if (reaction.reactionInfo[i].comment[j].rd_time) {
                    var timeIndex = returnGraphData.findIndex(obj => obj.time === reaction.reactionInfo[i].comment[j].rd_time)
                    if (timeIndex > -1) {
                      var emoteReact2 = reactionDict[reaction.reactionInfo[i].rd_type]
                      returnGraphData[timeIndex][emoteReact2] += 1
                    }
                  }
                }
              }
            }
          })
  
          // Calculate valence
          // (like + memorable + want) - (dislike + boring)
          for (var valenceIndex = 0; valenceIndex < returnGraphData.length; valenceIndex++) {
            returnGraphData[valenceIndex].valence = (returnGraphData[valenceIndex].like + returnGraphData[valenceIndex].memorable + returnGraphData[valenceIndex].want) - (returnGraphData[valenceIndex].dislike + returnGraphData[valenceIndex].boring)
          }
          var overAll
  
          // eslint-disable-next-line camelcase
          var Graph_min_sec
  
          // const sec = req.query.second
  
          if (req.query.minute == 1) {
            // eslint-disable-next-line camelcase
            Graph_min_sec = divideIntoMinutes(returnGraphData)
            overAll = retrieveOverallReaction2(results, errors, Graph_min_sec)
          } else {
            // eslint-disable-next-line camelcase
            Graph_min_sec = returnGraphData
            overAll = retrieveOverallReaction2(results, errors, returnGraphData)
          }
          // eslint-disable-next-line no-undef
          var finalExtremes = reactionEmotionExtremes(returnGraphData)
          // console.log(finalExtremes)
  
          // Reactions
  
          // valence
          addExtremes(finalExtremes, Graph_min_sec, 'valence', 'reaction')
          // like
          addExtremes(finalExtremes, Graph_min_sec, 'like', 'reaction')
          // love
          addExtremes(finalExtremes, Graph_min_sec, 'love', 'reaction')
          // want
          addExtremes(finalExtremes, Graph_min_sec, 'want', 'reaction')
          // memorable
          addExtremes(finalExtremes, Graph_min_sec, 'memorable', 'reaction')
          // boring
          addExtremes(finalExtremes, Graph_min_sec, 'boring', 'reaction')
          // dislike
          addExtremes(finalExtremes, Graph_min_sec, 'dislike', 'reaction')
          // confusing
          addExtremes(finalExtremes, Graph_min_sec, 'confusing', 'reaction')
          // engaging
          addExtremes(finalExtremes, Graph_min_sec, 'engaging', 'reaction')
          // misleading
          addExtremes(finalExtremes, Graph_min_sec, 'misleading', 'reaction')
          // accurate
          addExtremes(finalExtremes, Graph_min_sec, 'accurate', 'reaction')
          addExtremes(finalExtremes, Graph_min_sec, 'informative', 'reaction')
          // Emotion
        } catch (e) {
          console.log(e)
          errors.push('Error parsing reaction data')
        }
      } else { // No reaction data found
        errors.push('Reaction_emotion document not found')
      }
  
      // Generate peaks and valleys
  
      // var returnHeatMapData = retrieveHeatMapData(results, errors)
  
      function setDefaultValue (value, defaultValue) {
        return (value === undefined) ? defaultValue : value
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
          return {}
        }
        abc(results).then((data) => {
          // sss = data
          async.forEachSeries(returnData.graph_data, function (item1, callback1) {
            temp = temp + item1.like +
            item1.love + item1.want +
            item1.memorable + item1.boring +
            item1.dislike + item1.confusing +
            item1.engaging + item1.misleading +
            item1.accurate + item1.valence + item1.informative
  
            callback1()
          })
          if (temp === 0 || temp === '0') {
            return res.status(200).send({
              error: false,
              code: 200,
              message: 'data not found',
              response: []
            })
          } else {
            // Pulsecheck fix for missing 0 second data
            // replace t=0 data with t=1 data
            if (returnData.graph_data.length > 1 && results.content.is_pulsecheck) {
              const replacementData = JSON.parse(JSON.stringify(returnData.graph_data[1]))
              replacementData.time = 0
              returnData.graph_data[0] = replacementData
            }
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