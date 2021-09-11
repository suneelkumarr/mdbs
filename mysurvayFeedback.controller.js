const SurveyFeedback = require('../../models/surveyFeedback.model')
const ReactionEmotionData = require('../../models/reactionEmotionData.model')
// const Content = require('../models/content.model')
const Survey = require('../../models/survey.model')
const async = require('async')
const customImageHelper = require('../custom_image_helper')
const AdditionalCohorts = require('../../models/custom_cohort.model')

// For optional emoting filter
const ContentController = require('../content.controller')

const Math = require('mathjs')
const parse = require('csv-parse')


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


  const chunkify = (a, n, balanced) => {
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


exports.getFeedback = async (req, res) => {
    // Reformat to pre/post from in-stream
    if (!req.query.cnt_id || isNaN(req.query.cnt_id)) {
      return res.status(200).send({
        error: true,
        code: 400,
        message: 'Content ID is required and must be a number',
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
  
    var parallelQueries = {
      surveys: function (cb) {
        Survey.find({ cns_cnt_id: req.query.cnt_id, cns_type: { $in: ['pre', 'post'] } }, cb).lean()
      },
      surveyFeedback: function (cb) {
        SurveyFeedback.find(query, cb).lean()
      }
    }
  
    // Pass through the emotion intensity filter
    function passThrough (query, callback) {
      callback(null, query)
    }
  
    // Add additional reaction emotion data query if emoting is selected
    if (req.query.emoting) {
      parallelQueries.reactionEmotionData = function (cb) {
        ReactionEmotionData.find(query, cb).lean()
      }
      parallelQueries.emoting = passThrough.bind(null, req.query.emoting)
    }
  
    // Query each collection
    async.parallel(parallelQueries, function (err, results) { // Parse all results
      if (err) {
        return res.status(200).send({
          error: true,
          code: 500,
          message: err,
          response: []
        })
      }
      if (results.surveys.length <= 0) {
        return res.status(200).send({
          error: true,
          code: 404,
          message: 'No survey documents found',
          response: []
        })
      }
      if (results.surveyFeedback.length <= 0) {
        // return res.status(200).send({
        //   error: true,
        //   code: 404,
        //   message: 'No survey feedback found. Returned survey documents',
        //   response: results.surveys
        // })
      }
  
      // Emoting user filters
      if (results.emoting) {
        var qualifiedUsers = ContentController.getEmotingUsers(results.reactionEmotionData, results.emoting)
        results.surveyFeedback = results.surveyFeedback.filter(f => qualifiedUsers.includes(f.wh_mo_id))
      }
  
      var sampleSpace = results.surveyFeedback.length
  
      // Add option_answers field
      results.surveys.forEach((survey) => {
        survey.cns_questions.forEach((question) => {
          if (question.questionType === 'grid' /* || question.questionType === 'grid-multiple' */) {
            question.values.forEach((value) => {
              value.option_answers = JSON.parse(JSON.stringify(question.options)) // Deep copy
              value.option_answers.forEach((option) => {
                option.answers = []
              })
            })
            question.options.forEach((option) => {
              option.user_ids = []
              option.answer_percent = []
            })
          } else if (question.questionType === 'single' || question.questionType === 'image' || question.questionType === 'multiple') {
            question.options.forEach((option) => {
              option.user_ids = []
              option.answer_percent = []
            })
          } else if (question.questionType === 'freetext') {
            question.answers = []
            question.options = []
          } else if (question.questionType === 'numeric') {
            question.options = []
            for (var i = 1; i <= question.num_value; i += 1) {
              question.options.push({
                opt_id: i,
                option: i.toString(),
                user_ids: [],
                answer_percent: [],
                type: 'normal',
                rejection: false,
                children: []
              })
            }
          }
        })
      })
  
      var preSurvey = results.surveys.find((survey) => survey.cns_type === 'pre')
      var postSurvey = results.surveys.find((survey) => survey.cns_type === 'post')
  
      // Insert answers into survey
      results.surveyFeedback.forEach((feedback) => {
        var wh_mo_id = feedback.wh_mo_id
        // Pre and post
        feedback.pre_survey || post_survey.forEach((answer) => {
          if (answer) {
            var questionIndex = preSurvey || postSurvey.cns_questions.findIndex(obj => obj.qs_id === answer.qs_id)
            if (questionIndex > -1) {
              if (preSurvey || postSurvey.cns_questions[questionIndex].questionType === 'grid') {
                for (var key in answer.answer) {
                // Each grid answer is a key-value pair, so we need to match the key to the option (row)
                  if (answer.answer.hasOwnProperty(key)) {
                  // Get value index
                    var valueIndex = preSurvey || postSurvey.cns_questions[questionIndex].values.findIndex(obj => obj.gr_id === answer.answer[key])
                    // Get option index
                    if (valueIndex > -1) {
                      var optionIndex = preSurvey || postSurvey.cns_questions[questionIndex].values[valueIndex].option_answers.findIndex(obj => obj.opt_id === parseInt(key))
                      if (optionIndex > -1) {
                        preSurvey || postSurvey.cns_questions[questionIndex].values[valueIndex].option_answers[optionIndex].answers.push(wh_mo_id)
                        preSurvey || postSurvey.cns_questions[questionIndex].values[valueIndex].answers_total++
                      }
                    }
                  }
                }
              }
              else if (preSurvey||postSurvey.cns_questions[questionIndex].questionType === 'single' || preSurvey|| postSurvey.cns_questions[questionIndex].questionType === 'image' || preSurvey || postSurvey.cns_questions[questionIndex].questionType === 'numeric') {
                var optionIndex = preSurvey || postSurvey.cns_questions[questionIndex].options.findIndex(obj => obj.opt_id === answer.answer)
                if (optionIndex > -1) {
                  preSurvey || postSurvey.cns_questions[questionIndex].options[optionIndex].user_ids.push(wh_mo_id)
                }
              } else if (preSurvey || postSurvey.cns_questions[questionIndex].questionType === 'multiple') {
                answer.answer.forEach(item => {
                  var optionIndex = preSurvey || postSurvey.cns_questions[questionIndex].options.findIndex(obj => obj.opt_id === item)
                  if (optionIndex > -1) {
                    preSurvey || postSurvey.cns_questions[questionIndex].options[optionIndex].user_ids.push(wh_mo_id)
                  }
                })
              } else if (preSurvey || postSurvey.cns_questions[questionIndex].questionType === 'freetext') {
                preSurvey || postSurvey.cns_questions[questionIndex].answers.push({
                  answer: answer.answer,
                  wh_mo_id: wh_mo_id
                })
              }
            }
          }
        })
      })
  
    const que= (question)  => {
        if (question.questionType === 'grid' /* || question.questionType === 'grid-multiple' */) {
          // Restructure grid answers
          var options = question.options
          question.values.forEach((value) => {
            value.option_answers.forEach((optionAnswer) => {
              var optionIndex = options.findIndex(obj => obj.opt_id === optionAnswer.opt_id)
              if (optionIndex > -1) {
                options[optionIndex].user_ids.push(optionAnswer.answers)
                options[optionIndex].answer_percent.push(parseFloat(((optionAnswer.answers.length / sampleSpace) * 100).toFixed(2)))
                options[optionIndex].answers_total += optionAnswer.answers.length
              }
            })
            value.option_answers = undefined // We don't need these anymore
            value.answers_total = undefined
          })
        } else if (question.questionType === 'single' || question.questionType === 'image' || question.questionType === 'multiple') {
          question.options.forEach(option => {
            option.answer_percent = parseFloat(((option.user_ids.length / sampleSpace) * 100).toFixed(2))
          })
        } else if (question.questionType === 'numeric') {
          question.options[0].option += ' - ' + question.not_like
          question.options[question.options.length - 1].option += ' - ' + question.extreme_like
          question.options.forEach(option => {
            option.answer_percent = parseFloat(((option.user_ids.length / sampleSpace) * 100).toFixed(2))
          })
        }
      }
  
      // Parse pre and post answer stats
      preSurvey || postSurvey.cns_questions.forEach(
      que
      )
  
      return res.status(200).send({
        error: false,
        code: 200,
        message: 'Successfully retrieved survey feedback',
        response: [preSurvey, postSurvey]
      })
    })
  }