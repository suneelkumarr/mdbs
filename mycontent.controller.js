const SurveyFeedback = require('../../models/surveyFeedback.model')
const ReactionEmotionData = require('../../models/reactionEmotionData.model')
// const Content = require('../../models/content.model')
const async = require('async')
const HeatMapData = require('../../models/heatMapData.model')





const Content = require('../../models/content.model')

const SalientScene = require('../salient-scene.controller')
const Math = require('mathjs')

const fetch = require('node-fetch')
const { Query } = require('mongoose')



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


  Math.clip = function (number, min, max) {
    const clippedNumber = Math.max(min, Math.min(number, max))
    const fixedNumber = +clippedNumber.toFixed(2)
    // const stringifiedNumber = fixedNumber.toString()
    // return stringifiedNumber
    return fixedNumber
  }


  function chunkify (a, n, balanced) {
    if (n < 2) { return [a] }
  
    var len = a.length
    var out = []
    var i = 0
    var size
  
    if (len % n === 0) {
      size = Math.floor(len / n)
      while (i < len) {
        out.push(a.slice(i, i += size))
      }
    } else if (balanced) {
      while (i < len) {
        size = Math.ceil((len - i) / n--)
        out.push(a.slice(i, i += size))
      }
    } else {
      n--
      size = Math.floor(len / n)
      if (len % size === 0) { size-- }
      while (i < size * n) {
        out.push(a.slice(i, i += size))
      }
      out.push(a.slice(size * n))
    }
  
    return out
  }


  function filterEmoting (reactionEmotionData, length, emoting) {
              // TODO: Determine good levels for high/medium low.
        //       For now: high => absolute_value(valence) > 0.75
        //                medium => 0.75 >= absolute_value(valence) >= 0.25
        //                low => absolute_value(valence) < 0.25
    if (emoting === 'high' || emoting === 'medium' || emoting === 'low') {
      var qualifiedUsers = []
      // First we check if there is a valid emoting parameter so we know we need to get each user's average
      for (var i = 0; i < reactionEmotionData.length; i++) {
        var valenceAverage = 0
        // Each user
        for (var j = 0; j < reactionEmotionData[i].emotion_data.length; j++) {
        // Loop through this user's emotions
          valenceAverage += reactionEmotionData[i].emotion_data[j].ed_valence
        }
        if (reactionEmotionData[i].emotion_data.length > 0) {
          valenceAverage = valenceAverage / reactionEmotionData[i].emotion_data.length
          if (emoting === 'high') {
            if (Math.abs(valenceAverage) > 0.75) {
              qualifiedUsers.push(reactionEmotionData[i].wh_mo_id)
            }
          } else if (emoting === 'medium') {
            if (Math.abs(valenceAverage) >= 0.25 && Math.abs(valenceAverage) <= 0.75) {
              qualifiedUsers.push(reactionEmotionData[i].wh_mo_id)
            }
          } else if (emoting === 'low') {
            if (Math.abs(valenceAverage) < 0.25) {
              qualifiedUsers.push(reactionEmotionData[i].wh_mo_id)
            }
          }
        }
      }
      // Now we have the qualified users, so we can filter the heatmap and emotion_reaction data
      // Filter reactions and heatmap data
      reactionEmotionData = reactionEmotionData.filter(f => qualifiedUsers.includes(f.wh_mo_id))
      return reactionEmotionData
    }
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
      like: graphData[0].like,
      love: graphData[0].love,
      want: graphData[0].want,
      memorable: graphData[0].memorable,
      boring: graphData[0].boring,
      dislike: graphData[0].dislike,
      confusing: graphData[0].confusing,
      engaging: graphData[0].engaging,
      misleading: graphData[0].misleading,
      accurate: graphData[0].accurate,
      valence: graphData[0].valence,
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
        tempGraphObject.like += graphData[i].like
        tempGraphObject.love += graphData[i].love
        tempGraphObject.want += graphData[i].want
        tempGraphObject.memorable += graphData[i].memorable
        tempGraphObject.boring += graphData[i].boring
        tempGraphObject.dislike += graphData[i].dislike
        tempGraphObject.confusing += graphData[i].confusing
        tempGraphObject.engaging += graphData[i].engaging
        tempGraphObject.misleading += graphData[i].misleading
        tempGraphObject.accurate += graphData[i].accurate
        tempGraphObject.valence += graphData[i].valence
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
        tempGraphObject.like = tempGraphObject.like / tempLength
        tempGraphObject.love = tempGraphObject.love / tempLength
        tempGraphObject.want = tempGraphObject.want / tempLength
        tempGraphObject.memorable = tempGraphObject.memorable / tempLength
        tempGraphObject.boring = tempGraphObject.boring / tempLength
        tempGraphObject.dislike = tempGraphObject.dislike / tempLength
        tempGraphObject.confusing = tempGraphObject.confusing / tempLength
        tempGraphObject.engaging = tempGraphObject.engaging / tempLength
        tempGraphObject.misleading = tempGraphObject.misleading / tempLength
        tempGraphObject.accurate = tempGraphObject.accurate / tempLength
        tempGraphObject.valence = tempGraphObject.valence / tempLength
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
        tempGraphObject.like = tempGraphObject.like / tempLength
        tempGraphObject.love = tempGraphObject.love / tempLength
        tempGraphObject.want = tempGraphObject.want / tempLength
        tempGraphObject.memorable = tempGraphObject.memorable / tempLength
        tempGraphObject.boring = tempGraphObject.boring / tempLength
        tempGraphObject.dislike = tempGraphObject.dislike / tempLength
        tempGraphObject.confusing = tempGraphObject.confusing / tempLength
        tempGraphObject.engaging = tempGraphObject.engaging / tempLength
        tempGraphObject.misleading = tempGraphObject.misleading / tempLength
        tempGraphObject.accurate = tempGraphObject.accurate / tempLength
        tempGraphObject.valence = tempGraphObject.valence / tempLength
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
          like: graphData[i].like,
          love: graphData[i].love,
          want: graphData[i].want,
          memorable: graphData[i].memorable,
          boring: graphData[i].boring,
          dislike: graphData[i].dislike,
          confusing: graphData[i].confusing,
          engaging: graphData[i].engaging,
          misleading: graphData[i].misleading,
          accurate: graphData[i].accurate,
          valence: graphData[i].valence,
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
        tempGraphObject.like += graphData[i].like
        tempGraphObject.love += graphData[i].love
        tempGraphObject.want += graphData[i].want
        tempGraphObject.memorable += graphData[i].memorable
        tempGraphObject.boring += graphData[i].boring
        tempGraphObject.dislike += graphData[i].dislike
        tempGraphObject.confusing += graphData[i].confusing
        tempGraphObject.engaging += graphData[i].engaging
        tempGraphObject.misleading += graphData[i].misleading
        tempGraphObject.accurate += graphData[i].accurate
        tempGraphObject.valence += graphData[i].valence
        tempGraphObject.count += graphData[i].count
        tempGraphObject.eTotal += graphData[i].eTotal
        tempLength++
      }
    }
  
    return minuteGraph
  }

  function parsedEmotions (reactionEmotionData, length) {
    var overAllEmotionGraph = []
    var overAllReactionGraph = []
  
    // Initialize graphs
    for (var i = 0; i < length; i++) {
      overAllEmotionGraph.push({
        time: i,
        valence: 0,
        count: 0
      })
  
      overAllReactionGraph.push({
        time: i,
        valence: 0,
        like: 0,
        memorable: 0,
        want: 0,
        dislike: 0,
        boring: 0,
        accurate: 0,
        love: 0,
        engaging: 0,
        misleading: 0,
        confusing: 0,
        positive: 0,
        negative: 0
  
      })
    }
  
    // Set emotions
    var overAllEmotions = reactionEmotionData.map(a => a.emotion_data)
  
    // Calculate valence for graph
    for (var i = 0; i < overAllEmotions.length; i++) {
      for (var j = 0; j < overAllEmotions[i].length && j < length - 1; j++) {
        var index = overAllEmotionGraph.findIndex(obj => obj.time === overAllEmotions[i][j].ed_time)
        if (index > -1) {
          overAllEmotionGraph[index].valence +=
              Math.max(overAllEmotions[i][j].ed_happy, overAllEmotions[i][j].ed_suprised) -
              Math.max(overAllEmotions[i][j].ed_angry, overAllEmotions[i][j].ed_sad, overAllEmotions[i][j].ed_scared, overAllEmotions[i][j].ed_disgusted)
          overAllEmotionGraph[index].count++
        }
      }
    }
  
    // Set average by counts
    for (var i = 0; i < overAllEmotionGraph.length; i++) {
      if (overAllEmotionGraph[i].count > 0) {
        overAllEmotionGraph[i].valence = overAllEmotionGraph[i].valence / overAllEmotionGraph[i].count
      }
      delete overAllEmotionGraph[i].count
    }
  
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
      10: 'accurate'
    }
  
    // Filter out reaction data
    var reactions = reactionEmotionData.map(a => a.reaction_data)

    // Parse reactions
    for (var i = 0; i < reactions.length; i++) {
      for (var j = 0; j < reactions[i].length; j++) {
        for (var k = 0; k < reactions[i][j].comment.length; k++) {
          var timeIndex = overAllReactionGraph.findIndex(obj => obj.time === reactions[i][j].comment[k].rd_time)
          if (timeIndex > -1) {
            overAllReactionGraph[timeIndex][reactionDict[reactions[i][j].rd_type]]++
          }
        }
      }
    }
  
    // Calculate valence
    // (like + memorable + want) - (dislike + boring)
    for (var i = 0; i < overAllReactionGraph.length; i++) {
      overAllReactionGraph[i].valence = (overAllReactionGraph[i].like + overAllReactionGraph[i].memorable + overAllReactionGraph[i].want) -
      (overAllReactionGraph[i].dislike + overAllReactionGraph[i].boring)
  
      overAllReactionGraph[i].positive_count = (overAllReactionGraph[i].like + overAllReactionGraph[i].memorable + overAllReactionGraph[i].want +
      overAllReactionGraph[i].love + overAllReactionGraph[i].accurate)
  
      overAllReactionGraph[i].negative_count = (overAllReactionGraph[i].dislike + overAllReactionGraph[i].boring)
  
      delete overAllReactionGraph[i].like
      delete overAllReactionGraph[i].memorable
      delete overAllReactionGraph[i].want
      delete overAllReactionGraph[i].dislike
      delete overAllReactionGraph[i].boring
      delete overAllReactionGraph[i].love
      delete overAllReactionGraph[i].engaging
      delete overAllReactionGraph[i].misleading
      delete overAllReactionGraph[i].accurate
      delete overAllReactionGraph[i].memorable
      delete overAllReactionGraph[i].confusing
      delete overAllReactionGraph[i].positive
    }
  
    // Chunkify emotions
    var chunkedEmotions = chunkify(overAllEmotionGraph, 5, true)
    var segmentedEmotionGraph = []
  
    // Loop through each chunk
    for (var i = 0; i < chunkedEmotions.length; i++) {
      // Set up element for chunk
      var segmentedEmotionGraphData = {
        time: chunkedEmotions[i][0].time.toString() + '-' + chunkedEmotions[i][chunkedEmotions[i].length - 1].time.toString(),
        valence: 0
      }
  
      // Add up data for chunk
      for (var j = 0; j < chunkedEmotions[i].length; j++) {
        segmentedEmotionGraphData.valence += chunkedEmotions[i][j].valence
      }
  
      // Divide by chunk length to get average of that chunk
      segmentedEmotionGraphData.valence = segmentedEmotionGraphData.valence / chunkedEmotions[i].length
  
      segmentedEmotionGraph.push(segmentedEmotionGraphData)
    }
  
    // Chunkify reactions
    var chunkedReactionGraph = chunkify(overAllReactionGraph, 5, true)
    var segmentedReactionGraph = []
  
    for (var i = 0; i < chunkedReactionGraph.length; i++) {
      // Set up element for chunk
      var segmentedReactionGraphData = {
        time: chunkedReactionGraph[i][0].time.toString() + '-' + chunkedReactionGraph[i][chunkedReactionGraph[i].length - 1].time.toString(),
        valence: 0
  
      }
  
      // Add up data for chunk
      for (var j = 0; j < chunkedReactionGraph[i].length; j++) {
        segmentedReactionGraphData.valence += chunkedReactionGraph[i][j].valence
      }
  
      // Divide by chunk length to get average of that chunk
      segmentedReactionGraphData.valence = segmentedReactionGraphData.valence / chunkedReactionGraph[i].length
      segmentedReactionGraph.push(segmentedReactionGraphData)
    }
  
    var positiveOverall = 0
    var negativeOverall = 0
    // Calculate reaction ratio
    for (var i = 0; i < overAllReactionGraph.length; i++) {
      positiveOverall += overAllReactionGraph[i].positive_count
      negativeOverall += overAllReactionGraph[i].negative_count
    }
  
    function reduce (numerator, denominator) {
      var gcd = function gcd (a, b) {
        return b ? gcd(b, a % b) : a
      }
      gcd = gcd(numerator, denominator)
      return [numerator / gcd, denominator / gcd]
    }
  
    var reactionRatio
    if (negativeOverall > 0) {
      reactionRatio = positiveOverall / negativeOverall
    } else {
      reactionRatio = positiveOverall
    }
  
    for (var x = 0; x < overAllReactionGraph.length; x++) {
      delete overAllReactionGraph[x].positive
      delete overAllReactionGraph[x].negative
      delete overAllReactionGraph[x].negative_count
      delete overAllReactionGraph[x].positive_count
    }
  
    var overAllObj = {
      emotion_graph: overAllEmotionGraph,
      reaction_graph: overAllReactionGraph,
      segmented_emotion_graph: segmentedEmotionGraph,
      segmented_reaction_graph: segmentedReactionGraph,
      reaction_ratio: reactionRatio.toFixed(2) + ':1',
      emotion_intensity: 0
    }
    return overAllObj
  }


  function reactionEmotionExtremes (returnGraphData) {
    var emotionExtremes = {
      neutral: getEmotionPeaksAndValleys(returnGraphData, 'neutral'),
      sad: getEmotionPeaksAndValleys(returnGraphData, 'sad'),
      happy: getEmotionPeaksAndValleys(returnGraphData, 'happy'),
      scare: getEmotionPeaksAndValleys(returnGraphData, 'scare'),
      angry: getEmotionPeaksAndValleys(returnGraphData, 'angry'),
      disgust: getEmotionPeaksAndValleys(returnGraphData, 'disgust'),
      surprised: getEmotionPeaksAndValleys(returnGraphData, 'surprised'),
      evalence: getEmotionPeaksAndValleys(returnGraphData, 'evalence')
  
    }
  
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
      misleading: getReactionPeaksAndValleys(returnGraphData, 'misleading'),
      accurate: getReactionPeaksAndValleys(returnGraphData, 'accurate')
    }
  
    var extremes = {
      reaction: reactionExtremes,
      emotion: emotionExtremes
    }
  
    return extremes
  }

  function retrieveOverallReaction (graphData, reactionUserLength) {
    var overall = {
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
      valence: 0,
      total: 0,
      happy: 0,
      sad: 0,
      scare: 0,
      disgust: 0,
      surprised: 0,
      neutral: 0,
      angry: 0,
      evalence: 0,
      eTotal: 0
    }
  
    graphData.forEach((i) => {
      // Reaction
      overall.like += i.like
      overall.love += i.love
      overall.want += i.want
      overall.memorable += i.memorable
      overall.boring += i.boring
      overall.dislike += i.dislike
      overall.confusing += i.confusing
      overall.engaging += i.engaging
      overall.misleading += i.misleading
      overall.accurate += i.accurate
      overall.total += (i.like + i.love + i.want + i.memorable + i.boring + i.dislike + i.confusing + i.engaging + i.misleading + i.accurate)
  
      // Emotion
      overall.happy += i.happy
      overall.sad += i.sad
      overall.scare += i.scare
      overall.disgust += i.disgust
      overall.surprised += i.surprised
      overall.neutral += i.neutral
      overall.angry += i.angry
      overall.evalence += i.evalence
      overall.eTotal += i.eTotal
    })
  
    // Parse overall reactions
    overall.valence = parseFloat(((((overall.like + overall.memorable + overall.want) - (overall.dislike + overall.boring)) / reactionUserLength)).toFixed(3))
    overall.like = parseFloat(((overall.like / overall.total) * 100).toFixed(2))
    overall.love = parseFloat(((overall.love / overall.total) * 100).toFixed(2))
    overall.want = parseFloat(((overall.want / overall.total) * 100).toFixed(2))
    overall.memorable = parseFloat(((overall.memorable / overall.total) * 100).toFixed(2))
    overall.boring = parseFloat(((overall.boring / overall.total) * 100).toFixed(2))
    overall.dislike = parseFloat(((overall.dislike / overall.total) * 100).toFixed(2))
    overall.confusing = parseFloat(((overall.confusing / overall.total) * 100).toFixed(2))
    overall.misleading = parseFloat(((overall.misleading / overall.total) * 100).toFixed(2))
    overall.accurate = parseFloat(((overall.accurate / overall.total) * 100).toFixed(2))
    overall.engaging = parseFloat(((overall.engaging / overall.total) * 100).toFixed(2))
  
    // Parse overall emotions
    overall.happy = parseFloat(((overall.happy / overall.eTotal) * 100).toFixed(2))
    overall.sad = parseFloat(((overall.sad / overall.eTotal) * 100).toFixed(2))
    overall.scare = parseFloat(((overall.disgust / overall.eTotal) * 100).toFixed(2))
    overall.surprised = parseFloat(((overall.surprised / overall.eTotal) * 100).toFixed(2))
    overall.neutral = parseFloat(((overall.neutral / overall.eTotal) * 100).toFixed(2))
    overall.angry = parseFloat(((overall.angry / overall.eTotal) * 100).toFixed(2))
    overall.evalence = parseFloat((overall.evalence / graphData.length).toFixed(3))
    overall.disgust = parseFloat(((overall.disgust / overall.eTotal) * 100).toFixed(2))
  
    delete overall.eTotal
    delete overall.total
    return overall
  }


function retrieveHeatMapData(results, xResolution, yResolution) {
  console.log('_________________________________________________________________________________')
  if (results.heatMapData.length > 0) {
    try {
      var heatMapData = results.heatMapData

      var eyeData = []
      var hoverData = []
      var clickData = []

      // Loop through each user
      for (var m = 0; m < heatMapData.length; m++) {
        // Find if resolution is already included
        var resolution = ['1920', '1080'] // temp
        if (heatMapData[m].resolution) {
          var resolution = heatMapData[m].resolution.split(',')
        }

        let useBounding = true // We'll always use binding
        let leftXBound = null
        let rightXBound = null
        let topYBound = null
        let bottomYBound = null
        // Create bounding box if included
        if (Array.isArray(heatMapData[m].image_coordinates)) {
          if (heatMapData[m].image_coordinates.length === 4) {
            useBounding = true

            // [0] -> top left
            const topLeftCoords = heatMapData[m].image_coordinates[0].split(',')
            // [1] -> top right
            const topRightCoords = heatMapData[m].image_coordinates[1].split(',')
            // [2] -> bottom right (don't need)
            // const bottomRightCoords = heatMapData[m].image_coordinates[2].split(',')
            // [3] -> bottom left
            const bottomLeftCoords = heatMapData[m].image_coordinates[3].split(',')

            leftXBound = parseInt(topLeftCoords[0])
            rightXBound = parseInt(topRightCoords[0])
            topYBound = parseInt(topLeftCoords[1])
            bottomYBound = parseInt(bottomLeftCoords[1])
          }
        } else {
          // Just use screen resolution
          leftXBound = 0
          rightXBound = parseInt(resolution[0])
          topYBound = 0
          bottomYBound = parseInt(resolution[1])
        }

        // var xConversionFactor = parseInt(xResolution) / parseInt(currentX)
        // var yConversionFactor = parseInt(yResolution) / parseInt(currentY)

        // Loop through eye data
        if (heatMapData[m].eyedata) {
          for (var n = 0; n < heatMapData[m].eyedata.length; n++) {
            // Split into x,y coords
            for (var g = 0; g < heatMapData[m].eyedata[n].coordinates.length; g++) {
              var eyeCoords = heatMapData[m].eyedata[n].coordinates[g].split(',')
              if (!eyeCoords[0] || !eyeCoords[1]) {
                break
              }

              eyeCoords[0] = parseInt(eyeCoords[0])
              eyeCoords[1] = parseInt(eyeCoords[1])

              let withinBounds = true

              if (useBounding) {
                if (eyeCoords[0] <= leftXBound || eyeCoords[0] >= rightXBound || eyeCoords[1] >= bottomYBound || eyeCoords[1] <= topYBound) {
                  withinBounds = false
                }
              }

              if (withinBounds) {
                
                const xCoordPercentage = (eyeCoords[0] - leftXBound) / (rightXBound - leftXBound)
                const yCoordPercentage = (eyeCoords[1] - topYBound) / (bottomYBound - topYBound)

                heatMapData[m].eyedata[n].coordinates[g] = {
                  x: parseInt(xResolution) * xCoordPercentage,
                  y: parseInt(yResolution) * yCoordPercentage
                }
              } else {
                heatMapData[m].eyedata[n].coordinates[g] = undefined
              }
            }

            // Check if time is already included
            var eyeIndex = eyeData.findIndex(obj => obj.time === heatMapData[m].eyedata[n].time)
            // Data not yet in array
            if (eyeIndex === -1) {
              eyeData.push({
                time: heatMapData[m].eyedata[n].time,
                coordinates: [heatMapData[m].eyedata[n].coordinates]
              })
            } else { // Data in array
              eyeData[eyeIndex].coordinates.push(
                heatMapData[m].eyedata[n].coordinates
              )
            }
          }
        }

        // Loop through hover data
        if (heatMapData[m].hoverdata) {
          for (var n = 0; n < heatMapData[m].hoverdata.length; n++) {
            // Split into x,y coords
            for (var g = 0; g < heatMapData[m].hoverdata[n].coordinates.length; g++) {
              var hoverCoords = heatMapData[m].hoverdata[n].coordinates[g].split(',')
              if (!hoverCoords[0] || !hoverCoords[1]) {
                break
              }

              hoverCoords[0] = parseInt(hoverCoords[0])
              hoverCoords[1] = parseInt(hoverCoords[1])

              let withinBounds = true

              if (useBounding) {
                if (hoverCoords[0] <= leftXBound || hoverCoords[0] >= rightXBound || hoverCoords[1] >= bottomYBound || hoverCoords[1] <= topYBound) {
                  withinBounds = false
                }
              }

              if (withinBounds) {
                // heatMapData[m].hoverdata[n].coordinates[g] = {
                //   x: hoverCoords[0] * xConversionFactor,
                //   y: hoverCoords[1] * yConversionFactor
                // }

                // In this case we will instead use percentage past the origin coordinate (0,0) to the opposite edge of whatever the user's resolution is

                // const xCoordPercentage = (hoverCoords[0] - leftXBound) / rightXBound
                // const yCoordPercentage = (hoverCoords[1] - topYBound) / bottomYBound

                const xCoordPercentage = (hoverCoords[0] - leftXBound) / (rightXBound - leftXBound)
                const yCoordPercentage = (hoverCoords[1] - topYBound) / (bottomYBound - topYBound)

                heatMapData[m].hoverdata[n].coordinates[g] = {
                  x: parseInt(xResolution) * xCoordPercentage,
                  y: parseInt(yResolution) * yCoordPercentage
                }
              } else {
                heatMapData[m].hoverdata[n].coordinates[g] = undefined
              }
            }
            // Check if time is already included
            var hoverIndex = hoverData.findIndex(obj => obj.time === heatMapData[m].hoverdata[n].time)
            // Data not yet in array
            if (hoverIndex === -1) {
              hoverData.push({
                time: heatMapData[m].hoverdata[n].time,
                coordinates: [heatMapData[m].hoverdata[n].coordinates]
              })
            } else { // Data in array
              hoverData[hoverIndex].coordinates.push(
                heatMapData[m].hoverdata[n].coordinates
              )
            }
          }
        }

        // Loop through click data
        if (heatMapData[m].clickdata) {
          for (var p = 0; p < heatMapData[m].clickdata.length; p++) {
            // Split into x,y coords
            for (var t = 0; t < heatMapData[m].clickdata[p].coordinates.length; t++) {
              var clickCoords = heatMapData[m].clickdata[p].coordinates[t].split(',')
              if (!clickCoords[0] || !clickCoords[1]) {
                break
              }

              var clickCoords = heatMapData[m].clickdata[p].coordinates[t].split(',')
              if (!clickCoords[0] || !clickCoords[1]) {
                break
              }

              clickCoords[0] = parseInt(clickCoords[0])
              clickCoords[1] = parseInt(clickCoords[1])

              let withinBounds = true

              if (useBounding) {
                if (clickCoords[0] <= leftXBound || clickCoords[0] >= rightXBound || clickCoords[1] >= bottomYBound || clickCoords[1] <= topYBound) {
                  withinBounds = false
                }
              }

              if (withinBounds) {
                // heatMapData[m].clickdata[p].coordinates[t] = {
                //   x: clickCoords[0] * xConversionFactor,
                //   y: clickCoords[1] * yConversionFactor
                // }

                // In this case we will instead use percentage past the origin coordinate (0,0) to the opposite edge of whatever the user's resolution is

                // const xCoordPercentage = (clickCoords[0]) / (rightXBound
                // const yCoordPercentage = (clickCoords[1] - topYBound) / bottomYBound

                const xCoordPercentage = (clickCoords[0] - leftXBound) / (rightXBound - leftXBound)
                const yCoordPercentage = (clickCoords[1] - topYBound) / (bottomYBound - topYBound)

                
                heatMapData[m].hoverdata[p].coordinates[t] = {
                  x: parseInt(xResolution) * xCoordPercentage,
                  y: parseInt(yResolution) * yCoordPercentage
                }
              } else {
                heatMapData[m].clickdata[p].coordinates[t] = undefined
              }
            }
            // Check if time is already included
            var clickIndex = clickData.findIndex(obj => obj.time === heatMapData[m].clickdata[p].time)

            // Data not yet in array
            if (clickIndex === -1) {
              clickData.push({
                time: heatMapData[m].clickdata[p].time,
                coordinates: [heatMapData[m].clickdata[p].coordinates]
              })
            } else { // Data in array
              clickData[clickIndex].coordinates.push(
                heatMapData[m].clickdata[p].coordinates
              )
            }
          }
        }
      }

      // Flatten returned heat map data and add counts
      for (var s = 0; s < eyeData.length; s++) {
        eyeData[s].coordinates = [].concat(...eyeData[s].coordinates)
        eyeData[s].count = eyeData[s].coordinates.length
      }
      for (var a = 0; a < hoverData.length; a++) {
        hoverData[a].coordinates = [].concat(...hoverData[a].coordinates)
        hoverData[a].count = hoverData[a].coordinates.length
      }
      for (var u = 0; u < clickData.length; u++) {
        clickData[u].coordinates = [].concat(...clickData[u].coordinates)
        clickData[u].count = clickData[u].coordinates.length
      }

      eyeData.forEach((sec) => {
        sec.coordinates = sec.coordinates.filter(coord => coord)
        sec.count = sec.coordinates.length
      })

      hoverData.forEach((sec) => {
        sec.coordinates = sec.coordinates.filter(coord => coord)
        sec.count = sec.coordinates.length
      })

      clickData.forEach((sec) => {
        sec.coordinates = sec.coordinates.filter(coord => coord)
        sec.count = sec.coordinates.length
      })
      console.log(eyeData)

      return {
        eyeData: eyeData,
        clickData: clickData,
        hoverData: hoverData
      }
    } catch (e) {
      console.log(e)
      return []
    }
  } else {
    // No heat map data found
    return []
  }
}
  
  // function retrieveHeatMapDataUniversal (results) {
  //   if (results.heatMapData.length > 0) {
  //     try {
  //       var heatMapData = results.heatMapData
  
  //       var eyeData = []
  //       var hoverData = []
  //       var clickData = []
  
  //       // Loop through each user
  //       for (var m = 0; m < heatMapData.length; m++) {
  //         // Find if resolution is already included
  //         var resolution = ['1920', '1080'] // temp
  //         if (heatMapData[m].resolution) {
  //           var resolution = heatMapData[m].resolution.split(',')
  //         }
  
  //         let useBounding = true // We'll always use binding
  //         let leftXBound = null
  //         let rightXBound = null
  //         let topYBound = null
  //         let bottomYBound = null
  //         // Create bounding box if included
  //         if (Array.isArray(heatMapData[m].image_coordinates)) {
  //           if (heatMapData[m].image_coordinates.length === 4) {
  //             useBounding = true
  
  //             // [0] -> top left
  //             const topLeftCoords = heatMapData[m].image_coordinates[0].split(',')
  //             // [1] -> top right
  //             const topRightCoords = heatMapData[m].image_coordinates[1].split(',')
  //             // [2] -> bottom right (don't need)
  //             // const bottomRightCoords = heatMapData[m].image_coordinates[2].split(',')
  //             // [3] -> bottom left
  //             const bottomLeftCoords = heatMapData[m].image_coordinates[3].split(',')
  
  //             leftXBound = parseInt(topLeftCoords[0])
  //             rightXBound = parseInt(topRightCoords[0])
  //             topYBound = parseInt(topLeftCoords[1])
  //             bottomYBound = parseInt(bottomLeftCoords[1])
  //           }
  //         } else {
  //           // Just use screen resolution
  //           leftXBound = 0
  //           rightXBound = parseInt(resolution[0])
  //           topYBound = 0
  //           bottomYBound = parseInt(resolution[1])
  //         }
  
  //         // var xConversionFactor = parseInt(xResolution) / parseInt(currentX)
  //         // var yConversionFactor = parseInt(yResolution) / parseInt(currentY)
  
  //         // Loop through eye data
  //         if (heatMapData[m].eyedata) {
  //           for (var n = 0; n < heatMapData[m].eyedata.length; n++) {
  //             // Split into x,y coords
  //             for (var g = 0; g < heatMapData[m].eyedata[n].coordinates.length; g++) {
  //               var eyeCoords = heatMapData[m].eyedata[n].coordinates[g].split(',')
  //               if (!eyeCoords[0] || !eyeCoords[1]) {
  //                 break
  //               }
  
  //               eyeCoords[0] = parseInt(eyeCoords[0])
  //               eyeCoords[1] = parseInt(eyeCoords[1])
  
  //               let withinBounds = true
  
  //               if (useBounding) {
  //                 if (eyeCoords[0] <= leftXBound || eyeCoords[0] >= rightXBound || eyeCoords[1] >= bottomYBound || eyeCoords[1] <= topYBound) {
  //                   withinBounds = false
  //                 }
  //               }
  
  //               if (withinBounds) {
  //                 // heatMapData[m].eyedata[n].coordinates[g] = {
  //                 //   x: eyeCoords[0] * xConversionFactor,
  //                 //   y: eyeCoords[1] * yConversionFactor
  //                 // }
  
  //                 // In this case we will instead use percentage past the origin coordinate (0,0) to the opposite edge of whatever the user's resolution is
  
  //                 const xCoordPercentage = (eyeCoords[0] - leftXBound) / rightXBound
  //                 const yCoordPercentage = (eyeCoords[1] - topYBound) / bottomYBound
  //                 heatMapData[m].eyedata[n].coordinates[g] = {
  //                   x: xCoordPercentage,
  //                   y: yCoordPercentage
  //                 }
  //               } else {
  //                 heatMapData[m].eyedata[n].coordinates[g] = undefined
  //               }
  //             }
  
  //             // Check if time is already included
  //             var eyeIndex = eyeData.findIndex(obj => obj.time === heatMapData[m].eyedata[n].time)
  //             // Data not yet in array
  //             if (eyeIndex === -1) {
  //               eyeData.push({
  //                 time: heatMapData[m].eyedata[n].time,
  //                 coordinates: [heatMapData[m].eyedata[n].coordinates]
  //               })
  //             } else { // Data in array
  //               eyeData[eyeIndex].coordinates.push(
  //                 heatMapData[m].eyedata[n].coordinates
  //               )
  //             }
  //           }
  //         }
  
  //         // Loop through hover data
  //         if (heatMapData[m].hoverdata) {
  //           for (var n = 0; n < heatMapData[m].hoverdata.length; n++) {
  //             // Split into x,y coords
  //             for (var g = 0; g < heatMapData[m].hoverdata[n].coordinates.length; g++) {
  //               var hoverCoords = heatMapData[m].hoverdata[n].coordinates[g].split(',')
  //               if (!hoverCoords[0] || !hoverCoords[1]) {
  //                 break
  //               }
  
  //               hoverCoords[0] = parseInt(hoverCoords[0])
  //               hoverCoords[1] = parseInt(hoverCoords[1])
  
  //               let withinBounds = true
  
  //               if (useBounding) {
  //                 if (hoverCoords[0] <= leftXBound || hoverCoords[0] >= rightXBound || hoverCoords[1] >= bottomYBound || hoverCoords[1] <= topYBound) {
  //                   withinBounds = false
  //                 }
  //               }
  
  //               if (withinBounds) {
  //                 // heatMapData[m].hoverdata[n].coordinates[g] = {
  //                 //   x: hoverCoords[0] * xConversionFactor,
  //                 //   y: hoverCoords[1] * yConversionFactor
  //                 // }
  
  //                 // In this case we will instead use percentage past the origin coordinate (0,0) to the opposite edge of whatever the user's resolution is
  
  //                 const xCoordPercentage = (hoverCoords[0] - leftXBound) / rightXBound
  //                 const yCoordPercentage = (hoverCoords[1] - topYBound) / bottomYBound
  //                 heatMapData[m].hoverdata[n].coordinates[g] = {
  //                   x: xCoordPercentage,
  //                   y: yCoordPercentage
  //                 }
  //               } else {
  //                 heatMapData[m].hoverdata[n].coordinates[g] = undefined
  //               }
  //             }
  //             // Check if time is already included
  //             var hoverIndex = hoverData.findIndex(obj => obj.time === heatMapData[m].hoverdata[n].time)
  //             // Data not yet in array
  //             if (hoverIndex === -1) {
  //               hoverData.push({
  //                 time: heatMapData[m].hoverdata[n].time,
  //                 coordinates: [heatMapData[m].hoverdata[n].coordinates]
  //               })
  //             } else { // Data in array
  //               hoverData[hoverIndex].coordinates.push(
  //                 heatMapData[m].hoverdata[n].coordinates
  //               )
  //             }
  //           }
  //         }
  
  //         // Loop through click data
  //         if (heatMapData[m].clickdata) {
  //           for (var p = 0; p < heatMapData[m].clickdata.length; p++) {
  //             // Split into x,y coords
  //             for (var t = 0; t < heatMapData[m].clickdata[p].coordinates.length; t++) {
  //               var clickCoords = heatMapData[m].clickdata[p].coordinates[t].split(',')
  //               if (!clickCoords[0] || !clickCoords[1]) {
  //                 break
  //               }
  
  //               var clickCoords = heatMapData[m].clickdata[p].coordinates[t].split(',')
  //               if (!clickCoords[0] || !clickCoords[1]) {
  //                 break
  //               }
  
  //               clickCoords[0] = parseInt(clickCoords[0])
  //               clickCoords[1] = parseInt(clickCoords[1])
  
  //               let withinBounds = true
  
  //               if (useBounding) {
  //                 if (clickCoords[0] <= leftXBound || clickCoords[0] >= rightXBound || clickCoords[1] >= bottomYBound || clickCoords[1] <= topYBound) {
  //                   withinBounds = false
  //                 }
  //               }
  
  //               if (withinBounds) {
  //                 // heatMapData[m].clickdata[p].coordinates[t] = {
  //                 //   x: clickCoords[0] * xConversionFactor,
  //                 //   y: clickCoords[1] * yConversionFactor
  //                 // }
  
  //                 // In this case we will instead use percentage past the origin coordinate (0,0) to the opposite edge of whatever the user's resolution is
  
  //                 const xCoordPercentage = (clickCoords[0] - leftXBound) / rightXBound
  //                 const yCoordPercentage = (clickCoords[1] - topYBound) / bottomYBound
  //                 heatMapData[m].hoverdata[p].coordinates[t] = {
  //                   x: xCoordPercentage,
  //                   y: yCoordPercentage
  //                 }
  //               } else {
  //                 heatMapData[m].clickdata[p].coordinates[t] = undefined
  //               }
  //             }
  //             // Check if time is already included
  //             var clickIndex = clickData.findIndex(obj => obj.time === heatMapData[m].clickdata[p].time)
  
  //             // Data not yet in array
  //             if (clickIndex === -1) {
  //               clickData.push({
  //                 time: heatMapData[m].clickdata[p].time,
  //                 coordinates: [heatMapData[m].clickdata[p].coordinates]
  //               })
  //             } else { // Data in array
  //               clickData[clickIndex].coordinates.push(
  //                 heatMapData[m].clickdata[p].coordinates
  //               )
  //             }
  //           }
  //         }
  //       }
  
  //       // Flatten returned heat map data and add counts
  //       for (var s = 0; s < eyeData.length; s++) {
  //         eyeData[s].coordinates = [].concat(...eyeData[s].coordinates)
  //         eyeData[s].count = eyeData[s].coordinates.length
  //       }
  //       for (var a = 0; a < hoverData.length; a++) {
  //         hoverData[a].coordinates = [].concat(...hoverData[a].coordinates)
  //         hoverData[a].count = hoverData[a].coordinates.length
  //       }
  //       for (var u = 0; u < clickData.length; u++) {
  //         clickData[u].coordinates = [].concat(...clickData[u].coordinates)
  //         clickData[u].count = clickData[u].coordinates.length
  //       }
  
  //       eyeData.forEach((sec) => {
  //         sec.coordinates = sec.coordinates.filter(coord => coord)
  //         sec.count = sec.coordinates.length
  //       })
  
  //       hoverData.forEach((sec) => {
  //         sec.coordinates = sec.coordinates.filter(coord => coord)
  //         sec.count = sec.coordinates.length
  //       })
  
  //       clickData.forEach((sec) => {
  //         sec.coordinates = sec.coordinates.filter(coord => coord)
  //         sec.count = sec.coordinates.length
  //       })
  
  //       return {
  //         eyeData: eyeData,
  //         clickData: clickData,
  //         hoverData: hoverData
  //       }
  //     } catch (e) {
  //       console.log(e)
  //       return []
  //     }
  //   } else {
  //     // No heat map data found
  //     return []
  //   }
  // }


  //get content summary details

  exports.getContentSummary = async (req, res) => {
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
  
    if (req.query.user_ids) {
      var users = req.query.user_ids.split(',')
      query.wh_mo_id = {
        $in: users
      }
    }
  
    if (req.query.emoting) {
      query.emoting = req.query.emoting
    }
  
    var content = await Content.findOne({ cnt_id: req.query.cnt_id })
    var reactionEmotionData = await ReactionEmotionData.find({ cnt_id: req.query.cnt_id }).lean()
  
    var auth = 'Basic ' + Buffer.from(process.env.METRIC_AUTOMATION_USER + ':' + process.env.METRIC_AUTOMATION_PASSWORD).toString('base64')
    var header = { Authorization: auth }
    const options = {
      method: 'GET',
      headers: header
    }
    var url = process.env.METRIC_AUTOMATION_URL + '/dashboard/get_summary?cnt_id=' + req.query.cnt_id
  
    var metricsResult = {}
    try {
      const metricsResponse = await fetch(url, options)
      metricsResult = await metricsResponse.json()
    } catch (e) {
      console.log(e)
    }
  
    var filteredReactionEmotionData = []
    var filteredSurveyFeedback = []
  
    if (req.query.gender || req.query.age_range) {
      filteredReactionEmotionData = await ReactionEmotionData.find(query).lean()
      filteredSurveyFeedback = await SurveyFeedback.find(query).lean()
    }
  
    var contentLength = 0
    try {
      contentLength = Math.floor(content.cnt_length) + 1
    } catch (e) {
      var maxTime = 0
      var maxEmotion = 0
      var maxReaction = 0
      // No length variable so we need to create one from the max of emotion and reaction documents
      // Math.max.apply(Math, returnEmotionData.map(function (o) { return o.happy }))
      for (var i = 0; i < reactionEmotionData.length; i++) {
        // Check emotion data
        maxEmotion = Math.max.apply(Math, reactionEmotionData[i].emotion_data.map(function (o) { return o.ed_time }))
        maxTime = Math.max(maxTime, maxEmotion)
        // Check reaction data
        for (var j = 0; j < reactionEmotionData[i].reaction_data.length; j++) {
          if (reactionEmotionData[i].reaction_data[j].comment.length > 0) {
            maxReaction = Math.max.apply(Math, reactionEmotionData[i].reaction_data[j].comment.map(function (o) { return o.rd_time }))
            maxTime = Math.max(maxTime, maxReaction)
          }
        }
      }
      contentLength = maxTime + 1
    }
  
    var maleInfo = reactionEmotionData.filter(user => user.gender === 1)
    var femaleInfo = reactionEmotionData.filter(user => user.gender === 2)
    var youngInfo = reactionEmotionData.filter(user => user.age >= 18 && user.age <= 34)
    var olderInfo = reactionEmotionData.filter(user => user.age >= 35 && user.age <= 54)
  
    // If emoting is selected
  
    var overAllObject
    if (filteredReactionEmotionData.length > 0) {
      if (req.query.emoting) {
        filteredReactionEmotionData = filterEmoting(filteredReactionEmotionData, contentLength, req.query.emoting)
      }
      overAllObject = parsedEmotions(filteredReactionEmotionData, contentLength)
    } else {
      if (req.query.emoting) {
        reactionEmotionData = filterEmoting(reactionEmotionData, contentLength, req.query.emoting)
      }
      overAllObject = parsedEmotions(reactionEmotionData, contentLength)
    }
    var maleObject = parsedEmotions(maleInfo, contentLength)
    var femaleObject = parsedEmotions(femaleInfo, contentLength)
    var youngObject = parsedEmotions(youngInfo, contentLength)
    var olderObject = parsedEmotions(olderInfo, contentLength)
  
    // We don't need the non-segmented emotion graphs for cohorts
    delete maleObject.emotion_graph
    delete femaleObject.emotion_graph
    delete youngObject.emotion_graph
    delete olderObject.emotion_graph
  
    var cntThumbUrl
    var cntName
  
    // Content object details parsing
    if (content) {
      try {
        cntThumbUrl = content.cnt_thumb_url
      } catch (e) {
        console.log(e)
        cntThumbUrl = null
      }
      try {
        cntName = content.cnt_name
      } catch (e) {
        console.log(e)
        cntName = null
      }
  
      var summarySalientScenes = {
        positive: {
          images: []
        },
        negative: {
          images: []
        }
      }
  
      var salientScenes = {}
      if (!content.salient_scenes || (content.salient_scenes.emotions.length === 0 && content.salient_scenes.reactions.length === 0)) {
        salientScenes = SalientScene.generateSalientScenesInternal(reactionEmotionData.filter(obj => obj.cnt_id === content.cnt_id))
        await Content.findOneAndUpdate({ cnt_id: content.cnt_id }, { salient_scenes: salientScenes }, { new: true }) // Save for the future
      } else {
        salientScenes = content.salient_scenes
      }
  
      // We need 4 positive and 4 negative salient scenes
  
      var positiveEmotions = salientScenes.emotions.filter(salientScene => salientScene.positive === 1)
      var negativeEmotions = salientScenes.emotions.filter(salientScene => salientScene.positive === 0)
      var positiveReactions = salientScenes.reactions.filter(salientScene => salientScene.positive === 1)
      var negativeReactions = salientScenes.reactions.filter(salientScene => salientScene.positive === 0)
  
      const convertSalientSceneFormat = (salientScene, type) => {
        return {
          time: salientScene.time,
          image_url: salientScene.image_url,
          tags: salientScene.tags,
          observation: salientScene.observation,
          _id: salientScene._id,
          type: type
        }
      }
  
      // Positive
  
      // First try to get the top salient scenes for emotions and reactions
      if (positiveEmotions[0]) {
        summarySalientScenes.positive.images.push(convertSalientSceneFormat(positiveEmotions[0], 'emotion'))
      }
      if (positiveReactions[0]) {
        summarySalientScenes.positive.images.push(convertSalientSceneFormat(positiveReactions[0], 'reaction'))
      }
      if (positiveEmotions[1]) {
        summarySalientScenes.positive.images.push(convertSalientSceneFormat(positiveEmotions[1], 'emotion'))
      }
      if (positiveReactions[1]) {
        summarySalientScenes.positive.images.push(convertSalientSceneFormat(positiveReactions[1], 'reaction'))
      }
  
      // If we don't have enough add some more (such as emotion-only campaign)
      if (positiveEmotions[2] && summarySalientScenes.positive.images.length < 4) {
        summarySalientScenes.positive.images.push(convertSalientSceneFormat(positiveEmotions[2], 'emotion'))
      }
      if (positiveReactions[2] && summarySalientScenes.positive.images.length < 4) {
        summarySalientScenes.positive.images.push(convertSalientSceneFormat(positiveReactions[2], 'reaction'))
      }
      if (positiveEmotions[3] && summarySalientScenes.positive.images.length < 4) {
        summarySalientScenes.positive.images.push(convertSalientSceneFormat(positiveEmotions[3], 'emotion'))
      }
      if (positiveReactions[3] && summarySalientScenes.positive.images.length < 4) {
        summarySalientScenes.positive.images.push(convertSalientSceneFormat(positiveReactions[3], 'reaction'))
      }
  
      // Negative
  
      // First try to get the bottom salient scene for emotions and reactions
      if (negativeEmotions[0]) {
        summarySalientScenes.negative.images.push(convertSalientSceneFormat(negativeEmotions[0], 'emotion'))
      }
      if (negativeReactions[0]) {
        summarySalientScenes.negative.images.push(convertSalientSceneFormat(negativeReactions[0], 'reaction'))
      }
      if (negativeEmotions[1]) {
        summarySalientScenes.negative.images.push(convertSalientSceneFormat(negativeEmotions[1], 'emotion'))
      }
      if (negativeReactions[1]) {
        summarySalientScenes.negative.images.push(convertSalientSceneFormat(negativeReactions[1], 'reaction'))
      }
  
      // If we don't have enough add some more (such as emotion-only campaign)
      if (negativeEmotions[2] && summarySalientScenes.negative.images.length < 4) {
        summarySalientScenes.negative.images.push(convertSalientSceneFormat(negativeEmotions[2], 'emotion'))
      }
      if (negativeReactions[2] && summarySalientScenes.negative.images.length < 4) {
        summarySalientScenes.negative.images.push(convertSalientSceneFormat(negativeReactions[2], 'reaction'))
      }
      if (negativeEmotions[3] && summarySalientScenes.negative.images.length < 4) {
        summarySalientScenes.negative.images.push(convertSalientSceneFormat(negativeEmotions[3], 'emotion'))
      }
      if (negativeReactions[3] && summarySalientScenes.negative.images.length < 4) {
        summarySalientScenes.negative.images.push(convertSalientSceneFormat(negativeReactions[3], 'reaction'))
      }
  
      // Finally if we still don't have enough, add placeholders
      for (var j = 0; j < 4; j++) {
        if (summarySalientScenes.positive.images.length < 4) {
          summarySalientScenes.positive.images.push({
            time: 0,
            image_url: 'placeholder',
            tags: [],
            observation: '',
            _id: 'placeholder',
            type: 'placeholder'
          })
        } else {
          break
        }
      }
      for (var j = 0; j < 4; j++) {
        if (summarySalientScenes.negative.images.length < 4) {
          summarySalientScenes.negative.images.push({
            time: 0,
            image_url: 'placeholder',
            tags: [],
            observation: '',
            _id: 'placeholder',
            type: 'placeholder'
          })
        } else {
          break
        }
      }
  
      var takeaways
      try {
        takeaways = content.takeaways
      } catch (e) {
        console.log(e)
        takeaways = null
      }
  
      try {
  
      } catch (e) {
        console.log(e)
      }
    } else { // No content document found
      cntThumbUrl = null
    }
  
    function setDefaultValue (value, defaultValue) {
      try {
        return (value === undefined || value === null) ? defaultValue : value
      } catch (e) {
        return defaultValue
      }
    }
  
    // We need to decide what metrics we display based on
    // whether the content is longform or not
    var isLongForm = setDefaultValue(content.is_longform, 0)
  
    var keyMetricsArray = []
    var audienceTopBoxArray = []
    var maleData = {}
    var femaleData = {}
    var youngData = {}
    var oldData = {}
  
    if (isLongForm) {
      overAllObject.emotion_graph = divideIntoMinutesValence(overAllObject.emotion_graph)
      overAllObject.reaction_graph = divideIntoMinutesValence(overAllObject.reaction_graph)
      keyMetricsArray = [
        {
          name: 'Reaction Ratio',
          value: Math.clip(setDefaultValue(metricsResult.overall.rawReactionRatio, 50), 0, 100) + ':1',
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.rawReactionRatio, 50), 0, 100) + ':1'
        },
        {
          name: 'Emotion Intensity',
          value: Math.clip(setDefaultValue(metricsResult.overall.arousal, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.arousal, 50), 0, 100)
        },
        {
          name: 'Intent to Watch',
          value: Math.clip(setDefaultValue(metricsResult.overall.intentWatch, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.intentWatch, 50), 0, 100)
        },
        {
          name: 'Intent to Share',
          value: Math.clip(setDefaultValue(metricsResult.overall.intentShare, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.intentShare, 50), 0, 100)
        },
        {
          name: 'Program Rating',
          value: Math.clip(setDefaultValue(metricsResult.overall.programRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.programRating, 50), 0, 100)
        },
        {
          name: 'Genre Rating',
          value: Math.clip(setDefaultValue(metricsResult.overall.genreRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.genreRating, 50), 0, 100)
        }
      ]
  
      audienceTopBoxArray = [
        {
          name: 'Intent to Watch',
          value: Math.clip(setDefaultValue(metricsResult.overall.intentWatch, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.intentWatch, 50), 0, 100)
        },
        {
          name: 'Intent to Share',
          value: Math.clip(setDefaultValue(metricsResult.overall.intentShare, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.intentShare, 50), 0, 100)
        },
        {
          name: 'Program Rating',
          value: Math.clip(setDefaultValue(metricsResult.overall.programRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.programRating, 50), 0, 100)
        },
        {
          name: 'Genre Rating',
          value: Math.clip(setDefaultValue(metricsResult.overall.genreRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.genreRating, 50), 0, 100)
        }
      ]
  
      maleData = {
        segmented_emotion_graph: setDefaultValue(maleObject.segmented_emotion_graph, []),
        segmented_reaction_graph: setDefaultValue(maleObject.segmented_reaction_graph, []),
        reaction_ratio: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.male.rawReactionRatio, 50), 0, 100).toFixed(2)) + ':1',
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsMale.data.rawReactionRatio, 1), 0, 100).toFixed(2)) + ':1'
        },
        emotion_intensity: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.male.arousal, 50), 0, 100).toFixed(2)),
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsMale.data.arousal, 50), 0, 100).toFixed(2))
        },
        intentwatch: {
          value: Math.clip(setDefaultValue(metricsResult.male.intentWatch, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsMale.data.intentWatch, 50), 0, 100)
        },
        intentshare: {
          value: Math.clip(setDefaultValue(metricsResult.male.intentShare, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsMale.data.intentShare, 50), 0, 100)
        },
        programrating: {
          value: Math.clip(setDefaultValue(metricsResult.male.programRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsMale.data.programRating, 50), 0, 100)
        },
        betterthan: {
          value: Math.clip(setDefaultValue(metricsResult.male.genreRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsMale.data.genreRating, 50), 0, 100)
        }
      }
  
      femaleData = {
        segmented_emotion_graph: setDefaultValue(femaleObject.segmented_emotion_graph, []),
        segmented_reaction_graph: setDefaultValue(femaleObject.segmented_reaction_graph, []),
        reaction_ratio: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.female.rawReactionRatio, 50), 0, 100).toFixed(2)) + ':1',
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsFemale.data.rawReactionRatio, 1), 0, 100).toFixed(2)) + ':1'
        },
        emotion_intensity: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.female.arousal, 50), 0, 100).toFixed(2)),
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsFemale.data.arousal, 50), 0, 100).toFixed(2))
        },
        intentwatch: {
          value: Math.clip(setDefaultValue(metricsResult.female.intentWatch, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsFemale.data.intentWatch, 50), 0, 100)
        },
        intentshare: {
          value: Math.clip(setDefaultValue(metricsResult.female.intentShare, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsFemale.data.intentShare, 50), 0, 100)
        },
        programrating: {
          value: Math.clip(setDefaultValue(metricsResult.female.programRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsFemale.data.programRating, 50), 0, 100)
        },
        betterthan: {
          value: Math.clip(setDefaultValue(metricsResult.female.genreRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsFemale.data.genreRating, 50), 0, 100)
        }
      }
  
      youngData = {
        segmented_emotion_graph: setDefaultValue(youngObject.segmented_emotion_graph, []),
        segmented_reaction_graph: setDefaultValue(youngObject.segmented_reaction_graph, []),
        reaction_ratio: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.young.rawReactionRatio, 50), 0, 100).toFixed(2)) + ':1',
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsYoung.data.rawReactionRatio, 1), 0, 100).toFixed(2)) + ':1'
        },
        emotion_intensity: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.young.arousal, 50), 0, 100).toFixed(2)),
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsYoung.data.arousal, 50), 0, 100).toFixed(2))
        },
        intentwatch: {
          value: Math.clip(setDefaultValue(metricsResult.young.intentWatch, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsYoung.data.intentWatch, 50), 0, 100)
        },
        intentshare: {
          value: Math.clip(setDefaultValue(metricsResult.young.intentShare, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsYoung.data.intentShare, 50), 0, 100)
        },
        programrating: {
          value: Math.clip(setDefaultValue(metricsResult.young.programRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsYoung.data.programRating, 50), 0, 100)
        },
        betterthan: {
          value: Math.clip(setDefaultValue(metricsResult.young.genreRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsYoung.data.genreRating, 50), 0, 100)
        }
      }
  
      oldData = {
        segmented_emotion_graph: setDefaultValue(olderObject.segmented_emotion_graph, []),
        segmented_reaction_graph: setDefaultValue(olderObject.segmented_reaction_graph, []),
        reaction_ratio: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.old.rawReactionRatio, 50), 0, 100).toFixed(2)) + ':1',
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsOld.data.rawReactionRatio, 1), 0, 100).toFixed(2)) + ':1'
        },
        emotion_intensity: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.old.arousal, 50), 0, 100).toFixed(2)),
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsOld.data.arousal, 50), 0, 100).toFixed(2))
        },
        intentwatch: {
          value: Math.clip(setDefaultValue(metricsResult.old.intentWatch, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOld.data.intentWatch, 50), 0, 100)
        },
        intentshare: {
          value: Math.clip(setDefaultValue(metricsResult.old.intentShare, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOld.data.intentShare, 50), 0, 100)
        },
        programrating: {
          value: Math.clip(setDefaultValue(metricsResult.old.programRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOld.data.programRating, 50), 0, 100)
        },
        betterthan: {
          value: Math.clip(setDefaultValue(metricsResult.old.genreRating, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOld.data.genreRating, 50), 0, 100)
        }
      }
    } else {
      keyMetricsArray = [
        {
          name: 'Reaction Ratio',
          value: Math.clip(setDefaultValue(metricsResult.overall.rawReactionRatio, 50), 0, 100) + ':1',
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.rawReactionRatio, 50), 0, 100) + ':1'
        },
        {
          name: 'Emotion Intensity',
          value: Math.clip(setDefaultValue(metricsResult.overall.arousal, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.arousal, 50), 0, 100)
        },
        {
          name: 'Intent',
          value: Math.clip(setDefaultValue(metricsResult.overall.intent, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.intent, 50), 0, 100)
        },
        {
          name: 'Lift',
          value: Math.clip(setDefaultValue(metricsResult.overall.lift, 50), -100, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.lift, 50), -100, 100)
        },
        {
          name: 'Share',
          value: Math.clip(setDefaultValue(metricsResult.overall.share, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.share, 50), 0, 100)
        },
        {
          name: 'Virality',
          value: Math.clip(setDefaultValue(metricsResult.overall.virality, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.virality, 50), 0, 100)
        }
      ]
  
      audienceTopBoxArray = [
        {
          name: 'Intent',
          value: Math.clip(setDefaultValue(metricsResult.overall.intent, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.intent, 50), 0, 100)
        },
        {
          name: 'Lift',
          value: Math.clip(setDefaultValue(metricsResult.overall.lift, 50), -100, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.lift, 50), -100, 100)
        },
        {
          name: 'Share',
          value: Math.clip(setDefaultValue(metricsResult.overall.share, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.share, 50), 0, 100)
        },
        {
          name: 'Virality',
          value: Math.clip(setDefaultValue(metricsResult.overall.virality, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOverall.data.virality, 50), 0, 100)
        }
      ]
  
      maleData = {
        segmented_emotion_graph: setDefaultValue(maleObject.segmented_emotion_graph, []),
        segmented_reaction_graph: setDefaultValue(maleObject.segmented_reaction_graph, []),
        reaction_ratio: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.male.rawReactionRatio, 50), 0, 100).toFixed(2)) + ':1',
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsMale.data.rawReactionRatio, 1), 0, 100).toFixed(2)) + ':1'
        },
        emotion_intensity: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.male.arousal, 50), 0, 100).toFixed(2)),
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsMale.data.arousal, 50), 0, 100).toFixed(2))
        },
        intent: {
          value: Math.clip(setDefaultValue(metricsResult.male.intent, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsMale.data.intent, 50), 0, 100)
        },
        lift: {
          value: Math.clip(setDefaultValue(metricsResult.male.lift, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsMale.data.lift, 50), 0, 100)
        },
        share: {
          value: Math.clip(setDefaultValue(metricsResult.male.share, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsMale.data.share, 50), 0, 100)
        },
        virality: {
          value: Math.clip(setDefaultValue(metricsResult.male.virality, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsMale.data.virality, 50), 0, 100)
        }
      }
  
      femaleData = {
        segmented_emotion_graph: setDefaultValue(femaleObject.segmented_emotion_graph, []),
        segmented_reaction_graph: setDefaultValue(femaleObject.segmented_reaction_graph, []),
        reaction_ratio: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.female.rawReactionRatio, 50), 0, 100).toFixed(2)) + ':1',
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsFemale.data.rawReactionRatio, 1), 0, 100).toFixed(2)) + ':1'
        },
        emotion_intensity: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.female.arousal, 50), 0, 100).toFixed(2)),
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsFemale.data.arousal, 50), 0, 100).toFixed(2))
        },
        intent: {
          value: Math.clip(setDefaultValue(metricsResult.female.intent, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsFemale.data.intent, 50), 0, 100)
        },
        lift: {
          value: Math.clip(setDefaultValue(metricsResult.female.lift, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsFemale.data.lift, 50), 0, 100)
        },
        share: {
          value: Math.clip(setDefaultValue(metricsResult.female.share, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsFemale.data.share, 50), 0, 100)
        },
        virality: {
          value: Math.clip(setDefaultValue(metricsResult.female.virality, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsFemale.data.virality, 50), 0, 100)
        }
      }
  
      youngData = {
        segmented_emotion_graph: setDefaultValue(youngObject.segmented_emotion_graph, []),
        segmented_reaction_graph: setDefaultValue(youngObject.segmented_reaction_graph, []),
        reaction_ratio: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.young.rawReactionRatio, 50), 0, 100).toFixed(2)) + ':1',
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsYoung.data.rawReactionRatio, 1), 0, 100).toFixed(2)) + ':1'
        },
        emotion_intensity: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.young.arousal, 50), 0, 100).toFixed(2)),
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsYoung.data.arousal, 50), 0, 100).toFixed(2))
        },
        intent: {
          value: Math.clip(setDefaultValue(metricsResult.young.intent, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsYoung.data.intent, 50), 0, 100)
        },
        lift: {
          value: Math.clip(setDefaultValue(metricsResult.young.lift, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsYoung.data.lift, 50), 0, 100)
        },
        share: {
          value: Math.clip(setDefaultValue(metricsResult.young.share, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsYoung.data.share, 50), 0, 100)
        },
        virality: {
          value: Math.clip(setDefaultValue(metricsResult.young.virality, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsYoung.data.virality, 50), 0, 100)
        }
      }
  
      oldData = {
        segmented_emotion_graph: setDefaultValue(olderObject.segmented_emotion_graph, []),
        segmented_reaction_graph: setDefaultValue(olderObject.segmented_reaction_graph, []),
        reaction_ratio: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.old.rawReactionRatio, 50), 0, 100).toFixed(2)) + ':1',
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsOld.data.rawReactionRatio, 1), 0, 100).toFixed(2)) + ':1'
        },
        emotion_intensity: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.old.arousal, 50), 0, 100).toFixed(2)),
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsOld.data.arousal, 50), 0, 100).toFixed(2))
        },
        intent: {
          value: Math.clip(setDefaultValue(metricsResult.old.intent, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOld.data.intent, 50), 0, 100)
        },
        lift: {
          value: Math.clip(setDefaultValue(metricsResult.old.lift, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOld.data.lift, 50), 0, 100)
        },
        share: {
          value: Math.clip(setDefaultValue(metricsResult.old.share, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOld.data.share, 50), 0, 100)
        },
        virality: {
          value: Math.clip(setDefaultValue(metricsResult.old.virality, 50), 0, 100),
          norm: Math.clip(setDefaultValue(metricsResult.normsOld.data.virality, 50), 0, 100)
        }
      }
    }
    // Create return object with takeaways, salient scenes, etc
  
    var returnData = {
      isLongForm: isLongForm,
      key_results: {
        attention: {
          name: 'Attention',
          value: Math.clip(parseInt(setDefaultValue(metricsResult.overall.keyAttention, 50).toFixed(0)), 0, 100),
          norm: Math.clip(parseInt(setDefaultValue(metricsResult.normsOverall.data.keyAttention, 50).toFixed(0)), 0, 100)
        },
        emotional_engagement: {
          name: 'Emotional Engagement',
          value: Math.clip(parseInt(setDefaultValue(metricsResult.overall.keyEmotion, 50).toFixed(0)), 0, 100),
          norm: Math.clip(parseInt(setDefaultValue(metricsResult.normsOverall.data.keyEmotion, 50).toFixed(0)), 0, 100)
        },
        action: {
          name: 'Action',
          value: Math.clip(parseInt(setDefaultValue(metricsResult.overall.keyAction, 50).toFixed(0)), 0, 100),
          norm: Math.clip(parseInt(setDefaultValue(metricsResult.normsOverall.data.keyAction, 50).toFixed(0)), 0, 100)
        },
        overall_score: {
          name: 'Overall Score',
          value: Math.clip(parseInt(setDefaultValue(metricsResult.overall.keyOverall, 50).toFixed(0)), 0, 100),
          norm: Math.clip(parseInt(setDefaultValue(metricsResult.normsOverall.data.keyOverall, 50).toFixed(0)), 0, 100)
        },
        metrics: keyMetricsArray,
        observations: [
          'test observation overall 1',
          'test observation overall 2',
          'test observation overall 3'
        ]
      },
      audience_response: {
        reaction_ratio: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.overall.rawReactionRatio, 50), 0, 50).toFixed(2)) + ':1',
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsOverall.data.rawReactionRatio, 1), 0, 100).toFixed(2)) + ':1'
        },
        emotion_intensity: {
          value: parseFloat(Math.clip(setDefaultValue(metricsResult.overall.arousal, 50), 0, 50).toFixed(2)),
          norm: parseFloat(Math.clip(setDefaultValue(metricsResult.normsOverall.data.arousal, 50), 0, 50).toFixed(2))
        },
        emotion_graph: setDefaultValue(overAllObject.emotion_graph, []),
        emotion_segmented_graph: setDefaultValue(overAllObject.segmented_emotion_graph, []),
        reaction_graph: setDefaultValue(overAllObject.reaction_graph, []),
        reaction_segmented_graph: setDefaultValue(overAllObject.segmented_reaction_graph, []),
        survey_top_box: audienceTopBoxArray,
        observations: [
          'test observation 1',
          'test 2',
          'test 3'
        ]
      },
      salient_scenes: summarySalientScenes,
      takeaways: takeaways,
      cnt_thumb: cntThumbUrl,
      cnt_name: cntName,
      cohort: {
        data: [
          {
            name: 'Male',
            key: 'male',
            data: maleData
          },
          {
            name: 'Female',
            key: 'female',
            data: femaleData
          },
          {
            name: '18-34',
            key: '18-34',
            data: youngData
          },
          {
            name: '35-54',
            key: '35-54',
            data: oldData
          }
        ],
        observations: [
          'test observation 1',
          'test observation 2',
          'test observation 3'
        ]
      }
    }
  
    return res.status(200).send({
      error: false,
      code: 200,
      message: 'Successfully retrieved content summary',
      response: returnData
    })
  } 



  //get details 
  exports.getDetails = (req, res) => {
    if (!req.query.cnt_id || isNaN(req.query.cnt_id)) {
      return res.status(200).send({
        error: false,
        code: 400,
        message: 'Content ID required and must be a number',
        response: []
      })
    }
  
    // Query each collection
    async.parallel({
      content: function (cb) {
        Content.findOne({ cnt_id: req.query.cnt_id }, cb).lean()
      }
    }, function (err, results) { // Parse all results
      if (err) {
        return res.status(200).send({
          error: false,
          code: 500,
          message: 'Error retrieving content details',
          response: []
        })
      }
      if (!results.content) {
        return res.status(200).send({
          error: false,
          code: 404,
          message: 'No data found for content with ID ' + req.query.cnt_id,
          response: []
        })
      }
  
      var cntThumbUrl
      var cnfUrl
      var cntName
      var isLongForm
  
      // Content object details parsing
      if (results.content) {
        try {
          cntThumbUrl = results.content.cnt_thumb_url
        } catch (e) {
          console.log(e)
          cntThumbUrl = null
        }
        try {
          cnfUrl = results.content.cnt_files[0].cnf_url
        } catch (e) {
          console.log(e)
          cnfUrl = null
        }
        try {
          cntName = results.content.cnt_name
        } catch (e) {
          console.log(e)
          cntName = null
        }
        var takeaways
        try {
          takeaways = results.content.takeaways
        } catch (e) {
          console.log(e)
          takeaways = null
        }
        var isLongForm
        try {
          isLongForm = results.content.is_longform
        } catch (e) {
          console.log(e)
          isLongForm = 0
        }
        var cntType
        try {
          cntType = results.content.cnt_type
        } catch (e) {
          console.log(e)
          cntType = ''
        }
        var cntFiles
        try {
          cntFiles = results.content.cnt_files
        } catch (e) {
          console.log(e)
          cntFiles = []
        }
        var cntLength
        try {
          cntLength = results.content.cnt_length
        } catch (e) {
          console.log(e)
          cntLength = 0
        }
      } else { // No content document found
        cntThumbUrl = null
        cnfUrl = null
      }
  
      function setDefaultValue (value, defaultValue) {
        try {
          return (value === undefined) ? defaultValue : value
        } catch (e) {
          return defaultValue
        }
      }
  
      var returnData = {
        cnt_thumb: setDefaultValue(cntThumbUrl, ''),
        cnt_url: setDefaultValue(cnfUrl, ''),
        cnt_name: setDefaultValue(cntName, ''),
        cnt_type: setDefaultValue(cntType, ''),
        cnt_files: setDefaultValue(cntFiles, []),
        cnt_length: setDefaultValue(cntLength, 0),
        isLongContent: setDefaultValue(isLongForm, 0),
        takeaways: setDefaultValue(takeaways, [])
      }
  
      return res.status(200).send({
        error: false,
        code: 200,
        message: 'Successfully retrieved content details',
        response: returnData
      })
    })
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

        console.log()
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

  ///get greaph data 

  exports.getGraphData = (req, res) => {
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
  
    if (req.query.user_ids) {
      var users = req.query.user_ids.split(',')
      query.wh_mo_id = {
        $in: users
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
        Content.findOne({ cnt_id: req.query.cnt_id }, cb).lean()
      },
      reactionEmotionData: function (cb) {
        ReactionEmotionData.find(query, cb).lean()
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
      var emotion_user_ids = []
      var reaction_user_ids = []
      for (let i = 0; i < results.reactionEmotionData.length; i++) {
        if (results.reactionEmotionData[i].emotion_data.length === 0) {
          reaction_user_ids.push(results.reactionEmotionData[i].wh_mo_id)
        } else {
          emotion_user_ids.push(results.reactionEmotionData[i].wh_mo_id)
        }
      }
      // console.log(results.query)
      var errors = []
      var returnGraphData = [] // The final emotion object
      var returnEmotionData = [] // Emotion data separated
      var returnReactionData = [] // Reaction data separated
  
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

      if (results.reactionEmotionData.length > 0) {
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
            var maxReaction = 0
            // No length variable so we need to create one from the max of emotion and reaction documents
            // Math.max.apply(Math, returnEmotionData.map(function (o) { return o.happy }))
            for (var i = 0; i < results.reactionEmotionData.length; i++) {
              // Check emotion data
              maxEmotion = Math.max.apply(Math, results.reactionEmotionData[i].emotion_data.map(function (o) { return o.ed_time }))
              maxTime = Math.max(maxTime, maxEmotion)
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
              valence: 0,
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
            10: 'accurate'
          }
  
          // Two arrays to store the comment array and reaction data to be stored in the end
          // var commentData = [] // Comment data will now be separate
          // var wordCloudData = [] // For now we are excluding word cloud data
          var reactions2 = []
  
          for (var x = 0; x < results.reactionEmotionData.length; x++) {
            if (results.reactionEmotionData[x].reaction_data.length > 0) {
              reactions2.push({
                reactionInfo: results.reactionEmotionData[x].reaction_data,
                age: results.reactionEmotionData[x].age,
                gender: results.reactionEmotionData[x].gender
              })
            }
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
                    // console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
                    // console.log(timeIndex)
                    if (timeIndex > -1) {
                      var emoteReact2 = reactionDict[reaction.reactionInfo[i].rd_type]
                      // console.log('____________________________________________________________________________')
                      // console.log(emoteReact2)
                      returnGraphData[timeIndex][emoteReact2] += 1
                    }
                  }
                }
              }
            }
          })
  
          // Sort comments by time
          // commentData = commentData.sort((a, b) => (a.time > b.time) ? 1 : -1)
  
          // Only add words that appear more than 5 times
          // wordCloudData = wordCloudData.filter(o => o.count > 5)
          // if (wordCloudData.length === 0) {
          //   errors.push('No words with a count greater than 5 for word cloud')
          // }
  
          // Calculate valence
          // (like + memorable + want) - (dislike + boring)
          for (var valenceIndex = 0; valenceIndex < returnGraphData.length; valenceIndex++) {
            returnGraphData[valenceIndex].valence = (returnGraphData[valenceIndex].like + returnGraphData[valenceIndex].memorable + returnGraphData[valenceIndex].want) - (returnGraphData[valenceIndex].dislike + returnGraphData[valenceIndex].boring)
            // console.log( returnGraphData[valenceIndex].valence)
          }
  
          var finalExtremes = reactionEmotionExtremes(returnGraphData)
          // console.log(finalExtremes)
  
          // Reactions
  
          // valence
          addExtremes(finalExtremes, returnGraphData, 'valence', 'reaction')
          // like
          addExtremes(finalExtremes, returnGraphData, 'like', 'reaction')
          // love
          addExtremes(finalExtremes, returnGraphData, 'love', 'reaction')
          // want
          addExtremes(finalExtremes, returnGraphData, 'want', 'reaction')
          // memorable
          addExtremes(finalExtremes, returnGraphData, 'memorable', 'reaction')
          // boring
          addExtremes(finalExtremes, returnGraphData, 'boring', 'reaction')
          // dislike
          addExtremes(finalExtremes, returnGraphData, 'dislike', 'reaction')
          // confusing
          addExtremes(finalExtremes, returnGraphData, 'confusing', 'reaction')
          // engaging
          addExtremes(finalExtremes, returnGraphData, 'engaging', 'reaction')
          // misleading
          addExtremes(finalExtremes, returnGraphData, 'misleading', 'reaction')
          // accurate
          addExtremes(finalExtremes, returnGraphData, 'accurate', 'reaction')
  
          // Emotion
  
          // neutral
          addExtremes(finalExtremes, returnGraphData, 'neutral', 'emotion')
          // sad
          addExtremes(finalExtremes, returnGraphData, 'sad', 'emotion')
          // happy
          addExtremes(finalExtremes, returnGraphData, 'happy', 'emotion')
          // scare
          addExtremes(finalExtremes, returnGraphData, 'scare', 'emotion')
          // angry
          addExtremes(finalExtremes, returnGraphData, 'angry', 'emotion')
          // disgust
          addExtremes(finalExtremes, returnGraphData, 'disgust', 'emotion')
          // surprised
          addExtremes(finalExtremes, returnGraphData, 'surprised', 'emotion')
          // evalence
          addExtremes(finalExtremes, returnGraphData, 'evalence', 'emotion')
        } catch (e) {
          console.log(e)
          errors.push('Error parsing reaction data')
        }
      } else { // No reaction data found
        errors.push('Reaction_emotion document not found')
      }
  
      // Generate peaks and valleys
  
      // var returnHeatMapData = retrieveHeatMapData(results, errors)
  
      var overAll = retrieveOverallReaction(returnGraphData, results.reactionEmotionData.filter(user => user.reaction_data.length > 0).length)
      console.log(overAll)
  
      function setDefaultValue (value, defaultValue) {
        try {
          return (value === undefined) ? defaultValue : value
        } catch (e) {
          return defaultValue
        }
      }
  
      var returnData = {
        graph_data: setDefaultValue(returnGraphData, []),
        overall: setDefaultValue(overAll, {}),
          reaction_user_count: reaction_user_ids.length,
        emotion_user_count: emotion_user_ids.length,
        reaction_user_ids: JSON.stringify(reaction_user_ids),
        emotion_user_ids: JSON.stringify(emotion_user_ids)
      }
  
      return res.status(200).send({
        error: false,
        code: 200,
        message: 'Successfully retrieved graph data',
        response: returnData
      })
    })
    
  }


//get per minute graph data
  exports.getPerMinuteGraphData = (req, res) => {
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
  
    if (req.query.user_ids) {
      var users = req.query.user_ids.split(',')
      query.wh_mo_id = {
        $in: users
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
        Content.findOne({ cnt_id: req.query.cnt_id }, cb).lean()
      },
      reactionEmotionData: function (cb) {
        ReactionEmotionData.find(query, cb).lean()
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
      var emotion_user_ids = []
      var reaction_user_ids = []
      for (let i = 0; i < results.reactionEmotionData.length; i++) {
        if (results.reactionEmotionData[i].emotion_data.length === 0) {
          reaction_user_ids.push(results.reactionEmotionData[i].wh_mo_id)
        } else {
          emotion_user_ids.push(results.reactionEmotionData[i].wh_mo_id)
        }
      }
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
        // TODO: Determine good levels for high/medium low.
        //       For now: high => absolute_value(valence) > 0.75
        //                medium => 0.75 >= absolute_value(valence) >= 0.25
        //                low => absolute_value(valence) < 0.25
        // If the user sets an emoting level, we need to filter users based on their absolute valence
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
            var maxReaction = 0
            // No length variable so we need to create one from the max of emotion and reaction documents
            // Math.max.apply(Math, returnEmotionData.map(function (o) { return o.happy }))
            for (var i = 0; i < results.reactionEmotionData.length; i++) {
              // Check emotion data
              maxEmotion = Math.max.apply(Math, results.reactionEmotionData[i].emotion_data.map(function (o) { return o.ed_time }))
              maxTime = Math.max(maxTime, maxEmotion)
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
              valence: 0,
              count: 0,
              eTotal: 0,
              valenceArray: [],
              metricValence: 0
            })
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
              returnGraphData[k].valenceArray = returnGraphData[k].valenceArray.filter(n => n < returnGraphData[k].evalence - (2 * standardDeviation) || n > returnGraphData[k].evalence - (2 * standardDeviation))
              returnGraphData[k].metricValence = returnGraphData[k].valenceArray.reduce((a, b) => a + b, 0) / returnGraphData[k].valenceArray.length
  
              delete returnGraphData[k].valenceArray
            }
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
            10: 'accurate'
          }
  
          // Two arrays to store the comment array and reaction data to be stored in the end
          // var commentData = [] // Comment data will now be separate
          // var wordCloudData = [] // For now we are excluding word cloud data
          var reactions2 = []
  
          for (var x = 0; x < results.reactionEmotionData.length; x++) {
            if (results.reactionEmotionData[x].reaction_data.length > 0) {
              reactions2.push({
                reactionInfo: results.reactionEmotionData[x].reaction_data,
                age: results.reactionEmotionData[x].age,
                gender: results.reactionEmotionData[x].gender
              })
            }
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
  
          for (var valenceIndex = 0; valenceIndex < returnGraphData.length; valenceIndex++) {
            returnGraphData[valenceIndex].valence = (returnGraphData[valenceIndex].like + returnGraphData[valenceIndex].memorable + returnGraphData[valenceIndex].want) - (returnGraphData[valenceIndex].dislike + returnGraphData[valenceIndex].boring)
          }
        } catch (e) {
          console.log(e)
          errors.push('Error parsing reaction data')
        }
      } else { // No reaction data found
        errors.push('Reaction_emotion document not found')
      }
  
      // Get overall data
      var overAll = retrieveOverallReaction(returnGraphData, results.reactionEmotionData.filter(user => user.reaction_data.length > 0).length)
  
      var minuteGraph = divideIntoMinutes(returnGraphData)
  
      // Get peaks and valleys
      var finalExtremes = reactionEmotionExtremes(returnGraphData)
  
      // valence
      addExtremes(finalExtremes, minuteGraph, 'valence', 'reaction')
      // like
      addExtremes(finalExtremes, minuteGraph, 'like', 'reaction')
      // love
      addExtremes(finalExtremes, minuteGraph, 'love', 'reaction')
      // want
      addExtremes(finalExtremes, minuteGraph, 'want', 'reaction')
      // memorable
      addExtremes(finalExtremes, minuteGraph, 'memorable', 'reaction')
      // boring
      addExtremes(finalExtremes, minuteGraph, 'boring', 'reaction')
      // dislike
      addExtremes(finalExtremes, minuteGraph, 'dislike', 'reaction')
      // confusing
      addExtremes(finalExtremes, minuteGraph, 'confusing', 'reaction')
      // engaging
      addExtremes(finalExtremes, minuteGraph, 'engaging', 'reaction')
      // misleading
      addExtremes(finalExtremes, minuteGraph, 'misleading', 'reaction')
      // accurate
      addExtremes(finalExtremes, minuteGraph, 'accurate', 'reaction')
  
      // Emotion
  
      // neutral
      addExtremes(finalExtremes, minuteGraph, 'neutral', 'emotion')
      // sad
      addExtremes(finalExtremes, minuteGraph, 'sad', 'emotion')
      // happy
      addExtremes(finalExtremes, minuteGraph, 'happy', 'emotion')
      // scare
      addExtremes(finalExtremes, minuteGraph, 'scare', 'emotion')
      // angry
      addExtremes(finalExtremes, minuteGraph, 'angry', 'emotion')
      // disgust
      addExtremes(finalExtremes, minuteGraph, 'disgust', 'emotion')
      // surprised
      addExtremes(finalExtremes, minuteGraph, 'surprised', 'emotion')
      // evalence
      addExtremes(finalExtremes, minuteGraph, 'evalence', 'emotion')
  
      var returnData = {
        graph_data: minuteGraph,
        overall: overAll,
        reaction_user_count: reaction_user_ids.length,
        emotion_user_count: emotion_user_ids.length,
        reaction_user_ids: JSON.stringify(reaction_user_ids),
        emotion_user_ids: JSON.stringify(emotion_user_ids)
      }
  
      return res.status(200).send({
        error: false,
        code: 200,
        message: 'Successfully retrieved graph data',
        response: returnData
      })
    })
  }

//get trace data 
  exports.getTraceData = async (req, res) =>{
    if(req.query.cnt_id || isNaN(req.query.cnt_id)){
      return res.status(200).send({
        error:false,
        code:400,
        msg:"Content ID required and must be a number",
        response:[]
      })
    }


    const query = {
      cnt_id:req.query.cnt_id
    }


    if(req.query.gender){
      if(req.query.gender === 'm'){
        query.gender=1
      }
      else if(req.query.gender === 'f'){
        query.gender=2
      }
      else if( req.query.gender === 'mf'){
        query.gender={ $in: [1, 2]}
      }
    }

    if( req.query.age_range){
      var startRanges = req.query.age_range.split(',')
      var ranges=[]
      for(var x=0 ; x< startRanges.length ; x++){
        var splitRanges =(startRanges[x].split('-'))
        ranges = ranges.concat(splitRanges)
      }



      if(ranges.length % 2 !==0){
        return res.status(200).send({
          error:false,
          code:400,
          msg:"Must have an even amount of ages",
          response:[]
        })
      }

      var queryRanges = []
      var count = 1

      for(var x=0 ; x<ranges.length ; x++){
        if(x < ranges.length -1){
          queryRanges.push({
            age:{$gte:ranges[x] , $lte:ranges[x+count]}
          })
        }
        x++
      }
      query.$or = queryRanges
    }

    if(req.query.user_ids){
     var users =req.query.user_ids.split(',');
     query.wh_mo_id ={
       $in:{users}
     }

    }

    if(req.query.slag){
      const slags = req.query.slag.split(',');
      const cohorts= await AdditionalCohorts.find({cnt_id:req.query.cnt_id, slag:{$in:slags }}).lean();

      var userIdLists = []
      if(cohorts.length >0 ){
        cohorts.forEach((cohorts)=>{
          userIdLists.push(cohorts.wh_mo_id)
        })
      }

      if(req.query.user_ids){
        userIdLists.push(req.query.user_ids.split(','))
      }
      const userIds= getUniqueUserIds(userIdLists).unique()

      query.wh_mo_id ={
        $in:userIds
      }
    }else if(req.query.userIds){
      query.wh_mo_id = {
        $in:req.query.user_ids.split(',')
      }
    }

    var xResolution
    var yResolution

    if(req.query.x_resolution && req.query.y_resolution){
      xResolution = req.query.x_resolution
      yResolution= req.query.y_resolution
    }else{
      return res.status(200).send({
        error:false,
        code:400,
        msg:"X and Y resolution are required for transformation",
        response:[]
      })
    }

    const heatMapOptions = {
      resolution:1,
      image_coordinates:1
    }

    if(req.query.eye){
      heatMapOptions.eyedata =1
    }

    if(req.query.hover){
      heatMapOptions.hoverdata =1 
    }

    if(req.query.click){
      heatMapOptions.clickdata=1
    }

    const heatMapData = await HeatMapData.find(query, heatMapOptions)

    var returnHeatMapData = retrieveHeatMapData({
      HeatMapData:heatMapData
    }, xResolution, yResolution)

    if(returnHeatMapData){
      if(parseInt(req.query.eye) !== 1){
        delete returnHeatMapData.eyedata
      }
      if(parseInt(req.query.hover) !== 1){
        delete returnHeatMapData.hoverdata
      }
      if(parseInt(req.query.click) !== 1){
        delete returnHeatMapData.clickdata
      }
    }


    return res.status(200).send({
      error:false,
      code:200,
      msg:"Successfully retrieved content heatmap data",
      response: returnHeatMapData
    })

  }

  //get segmented data
  exports.getSegmentedData=(req,res)=>{
    if (!req.query.cnt_id || isNaN(req.query.cnt_id)) {
      return res.status(200).send({
        error: false,
        code: 400,
        message: 'Content ID required and must be a number',
        response: []
      })
    }

    var segmentNumber=1
    if(req.query.segment){
      segmentNumber= req.query.segment
    }
  // Programmatically build query to include optional filters
  var query = {
    cnt_id: req.query.cnt_id
  }

    if(req.query.gender){
      if(req.query.gender === 'm'){
        query.gender =1
      } else if(req.query.gender === 'f'){
        query.gender =2
      }
      else if(req.query.query === 'mf'){
        query.gender = {$in :[1,2]}
      }
    }

    if(req.query.age_range){
      var startRanges = req.query.age_range.split(',')
      var ranges =[]
      for(var x=0 ; x<startRanges.length ;x++){
        var splitRanges =(startRanges[x].split('-'))
        ranges= ranges.concat(splitRanges)
      }
      if(ranges.length % 2 !== 0){
        return res.status(200).send({
          error:false,
          code:400,
          msg:"Must have an even amount of ages",
          response: []
        })
      }
      var queryRanges =[]
      var count =1

      for(var x=0; x<ranges.length ; x++){
        if(x< ranges.length -1){
          queryRanges.push({
            age:{$gte : ranges[x], $lte:ranges[x+count]}
          })
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

    function passThrough (query, callback){
      callback(null, query)
    }

    async.parallel({
      content:function (cb) {
        Content.findOne({
          cnt_id:req.query.cnt_id
        },cb).lean()
      },
      reactionEmotionData:function (cb){
        ReactionEmotionData.find(query, cb).lean
      },
      segment: passThrough.bind(null, segmentNumber)
    },(err,results)=>{
      if(err){
        return res.status(200).send({
          error:false,
          code:500,
          msg:"Suggesfully added content",
          response:[]
        })
      }

      if(!results.content && results.reactionEmotionData.length){
        return res.status(200).send({
          error:false,
          code: 400,
          msg:"No data found for content with ID" + req.query.cnt_id,
          response:[]
        })
      }

      var errors =[]
      //emotion data parsing
      var returnGraphData =[]

      if(results.reactionEmotionData.length > 0){
        try{
          var emotions= results.reactionEmotionData.map(a => a.emotion_data)
          var contentLength = 0 
          try{
            contentLength = Math.floor(results.content.cnt_length) + 1
          }catch(e){
            var maxTime =0
            var maxEmotion=0
            var maxReaction=0

            for(var i=0 ; i< results.reactionEmotionData.length; i++){
              //check emotion data 
              maxEmotion = Math.max.apply(Math,results.reactionEmotionData[i].emotion_data.map(function(o){
                return o.ed_time
              }) )
              maxTime = Math.max(maxTime, maxEmotion)
              //check reaction data 
              for( var j=0 ; j< results.reactionEmotionData[i].reaction_data.length; j++){
                if(results.reactionEmotionData[i].reaction_data[j].comment.length > 0){
                  maxReaction = Math.max.apply(Math, results.reactionEmotionData[i].reaction_data[j].comment.map(function (o){
                    return o.ed_time
                  }))
                  maxTime = Math.max(maxTime, maxReaction)
                }
              }
            }
            contentLength = maxTime + 1
          }

          //Create combined Reaction and emotion array
          for( var startEmotionIndex =0 ; startEmotionIndex < contentLength ; startEmotionIndex++){
            returnGraphData.push({
              time:startEmotionIndex,
              natural:0,
              happy:0,
              sad:0,
              angry:0,
              surprised:0,
              scare:0,
              disgust:0,
              evalance:0,
              engagement:0,
              arousal:0,
              like:0,
              love:0,
              want:0,
              memorable:0,
              boring:0,
              dislike:0,
              confusing:0,
              engaging:0,
              misleading:0,
              accurate:0,
              valence:0,
              count:0,
              eTotal:0

            })
          }

          for(var i=0; i<emotions.length; i++){
            for(var j = 0 ; j < emotions[i].length && j < contentLength -1 ; j++){
              var index = returnGraphData.findIndex(obj => obj.time === emotions[i][j].ed_time)
              returnGraphData[index].evalance +=
              Math.max(emotions[i][j].ed_happy, emotions[i][j].ed_suprised)-
              Math.max(emotions[i][j].ed_angry, emotions[i][j].ed_sad, emotions[i][j].ed_scared, emotions[i][j].ed_disgusted)
              returnGraphData[index].natural += emotions[i][j].ed_neutral
              returnGraphData[index].happy += emotions[i][j].ed_happy
              returnGraphData[index].sad += emotions[i][j].ed_sad
              returnGraphData[index].angry += emotions[i][j].ed_angry
              returnGraphData[index].surprised += emotions[i][j].ed_suprised
              returnGraphData[index].scare += emotions[i][j].ed_scared
              returnGraphData[index].disgust += emotions[i][j].ed_disgusted
              returnGraphData[index].count++
              returnGraphData[index].eTotal += (emotions[i][j].ed_disgusted+emotions[i][j].ed_scared + emotions[i][j].ed_happy +
                emotions[i][j].ed_suprised + emotions[i][j].ed_angry + emotions[i][j].ed_sad + emotions[i][j].ed_neutral)
            }
          }

          for(var k=0; k< returnGraphData.length ; k++){
            if(returnGraphData[k].count > 0){
              returnGraphData[k].neutral = returnGraphData[k].neutral / returnGraphData[k].count
              returnGraphData[k].sad = returnGraphData[k].sad / returnGraphData[k].count
              returnGraphData[k].happy = returnGraphData[k].happy / returnGraphData[k].count
              returnGraphData[k].scare = returnGraphData[k].scare / returnGraphData[k].count
              returnGraphData[k].angry = returnGraphData[k].angry / returnGraphData[k].count
              returnGraphData[k].disgust = returnGraphData[k].disgust / returnGraphData[k].count
              returnGraphData[k].surprised = returnGraphData[k].surprised / returnGraphData[k].count
              returnGraphData[k].evalence = returnGraphData[k].evalence / returnGraphData[k].count
              returnGraphData[k].eTotal = returnGraphData[k].eTotal / returnGraphData[k].count
            }
          }

        }catch(e){
          console.log(e)
          errors.push('Error parsing emotion data')
        }
        try{
            // Reaction Data parsing 
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
              10: 'accurate'
            }

            var reactions = results.reactionEmotionData.map(a=> a.reaction_data)
            reactions.forEach(function (reaction) {
              for(var i =0; i < reaction.length; i++ ){
                if(reaction[i].comment.length > 0){
                  for (var j=0 ; j < reaction[i].comment.length ; j++){
                    var timeIndex = returnGraphData.findIndex(obj => obj.time === reaction[i].comment[j].rd_time)
                    if (timeIndex > -1) {
                      var emoteReact2 = reactionDict[reaction[i].rd_type]
                      // console.log(emoteReact2)
                      returnGraphData[timeIndex][emoteReact2] += 1
                    }
                  }
                }
              }
            })

            for (var valenceIndex = 0; valenceIndex < returnGraphData.length; valenceIndex++) {
              returnGraphData[valenceIndex].valence = (returnGraphData[valenceIndex].like + returnGraphData[valenceIndex].memorable + returnGraphData[valenceIndex].want) - (returnGraphData[valenceIndex].dislike + returnGraphData[valenceIndex].boring)
              // console.log(returnGraphData[valenceIndex].valence)
            }
        }catch(e){
          console.log(e)
          errors.push('Error parsing Reaction data')
        }
      }
      else{
        errors.push('Reaction_emotion document not found')
      }

      // Split into segmented chunks
    var segments = results.segment
    // console.log(segments);

    var chunkedGraph = chunkify(returnGraphData, segments, true)

    // console.log(chunkedGraph)
    var segmentedGraph = []

    for (var i = 0; i < chunkedGraph.length; i++) {
      // Set up element for chunk
      var segmentedGraphData = {
        time: chunkedGraph[i][0].time.toString() + '-' + chunkedGraph[i][chunkedGraph[i].length - 1].time.toString(),
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
        valence: 0
      }

      // Add up data for chunk
      for (var j = 0; j < chunkedGraph[i].length; j++) {
        segmentedGraphData.neutral += chunkedGraph[i][j].neutral
        // console.log(segmentedGraphData.neutral)
        segmentedGraphData.happy += chunkedGraph[i][j].happy
        segmentedGraphData.sad += chunkedGraph[i][j].sad
        segmentedGraphData.angry += chunkedGraph[i][j].angry
        segmentedGraphData.surprised += chunkedGraph[i][j].surprised
        segmentedGraphData.scare += chunkedGraph[i][j].scare
        segmentedGraphData.disgust += chunkedGraph[i][j].disgust
        segmentedGraphData.evalence += chunkedGraph[i][j].evalence
        segmentedGraphData.engagement += chunkedGraph[i][j].engagement
        segmentedGraphData.arousal += chunkedGraph[i][j].arousal
        segmentedGraphData.like += chunkedGraph[i][j].like
        segmentedGraphData.love += chunkedGraph[i][j].love
        segmentedGraphData.want += chunkedGraph[i][j].want
        segmentedGraphData.memorable += chunkedGraph[i][j].memorable
        segmentedGraphData.boring += chunkedGraph[i][j].boring
        segmentedGraphData.dislike += chunkedGraph[i][j].dislike
        segmentedGraphData.confusing += chunkedGraph[i][j].confusing
        segmentedGraphData.engaging += chunkedGraph[i][j].engaging
        segmentedGraphData.misleading += chunkedGraph[i][j].misleading
        segmentedGraphData.accurate += chunkedGraph[i][j].accurate
        segmentedGraphData.valence += chunkedGraph[i][j].valence
      }
      // Divide by chunk length to get average of that chunk
      // console.log(chunkedGraph[i].length)
      // console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
      // console.log(segmentedGraphData.neutral)
      segmentedGraphData.neutral = segmentedGraphData.neutral / chunkedGraph[i].length
      // console.log('-------------------------------------------------------------------');
      // console.log(segmentedGraphData.neutral)
      segmentedGraphData.happy = segmentedGraphData.happy / chunkedGraph[i].length
      segmentedGraphData.sad = segmentedGraphData.sad / chunkedGraph[i].length
      segmentedGraphData.angry = segmentedGraphData.angry / chunkedGraph[i].length
      segmentedGraphData.surprised = segmentedGraphData.surprised / chunkedGraph[i].length
      segmentedGraphData.scare = segmentedGraphData.scare / chunkedGraph[i].length
      segmentedGraphData.disgust = segmentedGraphData.disgust / chunkedGraph[i].length
      segmentedGraphData.evalence = segmentedGraphData.evalence / chunkedGraph[i].length
      segmentedGraphData.engagement = segmentedGraphData.engagement / chunkedGraph[i].length
      segmentedGraphData.arousal = segmentedGraphData.arousal / chunkedGraph[i].length
      segmentedGraphData.like = segmentedGraphData.like / chunkedGraph[i].length
      segmentedGraphData.love = segmentedGraphData.love / chunkedGraph[i].length
      segmentedGraphData.want = segmentedGraphData.want / chunkedGraph[i].length
      segmentedGraphData.memorable = segmentedGraphData.memorable / chunkedGraph[i].length
      segmentedGraphData.boring = segmentedGraphData.boring / chunkedGraph[i].length
      segmentedGraphData.dislike = segmentedGraphData.dislike / chunkedGraph[i].length
      segmentedGraphData.confusing = segmentedGraphData.confusing / chunkedGraph[i].length
      segmentedGraphData.engaging = segmentedGraphData.engaging / chunkedGraph[i].length
      segmentedGraphData.misleading = segmentedGraphData.misleading / chunkedGraph[i].length
      segmentedGraphData.accurate = segmentedGraphData.accurate / chunkedGraph[i].length
      segmentedGraphData.valence = segmentedGraphData.valence / chunkedGraph[i].length
      segmentedGraph.push(segmentedGraphData)
    }

    return res.status(200).send({
      error: false,
      code: 200,
      message: 'Successfully retrieved segmented content details',
      response: {
        graph_data: segmentedGraph
      }
    })



    })
  }