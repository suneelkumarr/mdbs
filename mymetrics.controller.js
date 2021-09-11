const fetch = require('node-fetch');
const AdditionalCohorts = require('../../models/custom_cohort.model');
const Content = require('../../models/content.model');

const  setDefault = (value, defaultValue) =>{
    try{
        return (value === undefined || !value) ? defaultValue : value
    }catch(e){
        return defaultValue
    }
}

const getUniqueUserIds = (arrays) => {
    return arrays.shift().reduce( function (res, v) {
        if(res.indexOf(v) === -1 && arrays.every(function (a){
            return a.indexOf(v) !== -1
        })) return res
    }, [])
}

 const  flat = (input , depth = 1, stack = []) => {
    for (const item of input) {
        if(item instanceof Array && depth > 0 ) {
            flat(item , depth - 1, stack )
        } else {
            stack.push(item)
        }
    }
}

exports.getContentMetrics = async ( req, res) => {
    try{ 
        if(!req.query.cnt_id || isNaN(req.query.cnt_id)){
            return res.status(200).send({
                eroor: true,
                code:400,
                message:'Content ID required and must be a number',
                response:[]
            })
        }
        const content = await Content.findOne({cnt_id:req.query.cnt_id})
        if(!content){
            return res.status(200).send({
                error:false,
                code:404,
                message:'Content not found',
                response:[]
            })
        }
        var categoriesURL = process.env.METRIC_AUTOMATION_URL + '/tools/get_categories_and_genres'
        var auth = 'Basic ' + Buffer.from(process.env.METRIC_AUTOMATION_USER + ':' + process.env.METRIC_AUTOMATION_PASSWORD).toString('base64')
        var header = { Authorization: auth }
        const options = {
          method: 'GET',
          headers: header
        }
    
        var categoriesResult = {}
        try {
          const categoriesResponse = await fetch(encodeURI(categoriesURL), options)
          categoriesResult = await categoriesResponse.json()
        } catch (e) {
          console.log(e)
        }

        var lengthType = 'short'

        if(content.is_longform === 1){
            lengthType = 'long'
        }

        var paramList = '?cnt_id=' + req.query.cnt_id
        var normParam = '?category=' + categoriesResult.categories[content.cnt_category].replace('&' , '%26') + '&length_type=' + lengthType

        // REVISIT ASAP
          if(req.query.gender){
            paramList += '&gender=' + req.query.gender
        }

        if(req.query.age_range) {
            const ages = req.query.age_range.split('-')
            paramList += '&age_min' + ages[0] + '&age_max=' + ages[1] 
        }

        if(req.query.slag) {
            const slags = req.query.slag.split(',')
            const cohorts = await AdditionalCohorts.find({ cnt_id: req.query.cnt_id, slag:{$in:slags}}).lean()
            console.log(cohorts)
            var userIdLists = []
            if(cohorts.length > 0){
                cohorts.forEach((cohort) =>{
                    userIdLists.push(cohort.wh_mo_ids)
                })
            }

            if(req.query.user_ids){
                userIdLists.push(req.query.user_ids.split(','))
            }

            const userIds = getUniqueUserIds(userIdLists).unique()

            paramList += '&user_ids=' + userIds.json(',')

        }else if(req.query.user_ids)
        {
            paramList += '&user_ids=' + req.query.user_ids
        }

        var metricsResult ={}

        if(!req.query.time_range){
            var url = process.env.METRIC_AUTOMATION_URL + '/report/get_metrics' + paramList
            try{
                const metricsResponse = await fetch(encodeURI(url),options)
                metricsResult = await metricsResponse.json()
            }catch(e){
                console.log(e)
            }
        } else {
            paramList += '&segments=' + req.query.time_range
            var url = process.env.METRIC_AUTOMATION_URL + '/tools/get_segment_metrics' + paramList
            let segResult = {}
            try{
                const metricsResponce = await fetch(encodeURI(url), options)
                segResult = await metricsResponce.json()
                metricsResult.keyOverall =  segResult.report_metrics.overallScoreMetric
                metricsResult.keyAttention = segResult.report_metrics.attentionMetric
                metricsResult.keyEmotion = segResult.report_metrics.emotionMetric
                metricsResult.keyAction = segResult.report_metrics.actionMetric
            } catch(e){
                console.log(e)
            }
        }

        var normsUrl = process.env.METRIC_AUTOMATION_URL + '/norms/get_norms' + normParam
        var normsResult = {}

        try{
            const normResponse = await fetch(normsUrl, options)
            normsResult = await normResponse.json()
        }catch (e){
            console.log(e)
        }
         
        const result = [
            {
                name:'overall',
                key:'overall',
                values:{
                    value:setDefault(metricsResult.keyOverall,50).toFixed(0),
                    tooltip:'Value'
                },
                norms :{
                    norm: setDefault(normsResult.keyOverall,50).toFixed(0),
                    tooltip:'Norm'
                }
            },
            {
                name:'Attention',
                key:'attention',
                values:{
                    value:setDefault(metricsResult.keyOverall,50).toFixed(0),
                    tooltip:'Value'
                },
                norms :{
                    norm: setDefault(normsResult.keyOverall,50).toFixed(0),
                    tooltip:'Norm'
                }
            },
            {
                name:'Emotion',
                key:'emotion',
                values:{
                    value:setDefault(metricsResult.keyOverall,50).toFixed(0),
                    tooltip:'Value'
                },
                norms :{
                    norm: setDefault(normsResult.keyOverall,50).toFixed(0),
                    tooltip:'Norm'
                }
            },
            {
                name:'Action',
                key:'action',
                values:{
                    value:setDefault(metricsResult.keyOverall,50).toFixed(0),
                    tooltip:'Value'
                },
                norms :{
                    norm: setDefault(normsResult.keyOverall,50).toFixed(0),
                    tooltip:'Norm'
                }
            },
        ]

        return res.status(200).send({
            error:false,
            code:200,
            message:'Successfully retrieved content metrics for' + req.query.cnt_id,
            response:result
        })
    }catch(e) {
        return res.status(200).send({
            error:true,
            code:500,
            message:'Error retrieving content metrics for ' + req.query.cnt_id,
            response :[
                {
                    name: 'Overall',
                    key:'overall',
                    values:{
                        value:'50',
                        tooltip:'value'
                    },norms:{
                        norm : '50',
                        tooltip:'Norm'
                    }
                },
                {
                    name:'Attention',
                    key:'attention',
                    values:{
                        value:'50',
                        tooltip:'value' 
                    },norms:{
                        norm:'50',
                        tooltip:'Norm'
                    }
                },
                {
                    name:'Emotion',
                    key:'emotion',
                    values:{
                        value:'50',
                        tooltip:'value' 
                    },norms:{
                        norm:'50',
                        tooltip:'Norm'
                    }
                },
                {
                    name:'Action',
                    key:'action',
                    values:{
                        value:'50',
                        tooltip:'value' 
                    },norms:{
                        norm:'50',
                        tooltip:'Norm'
                    }
                },
            ]
        })
    }
}