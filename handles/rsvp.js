const axios = require("axios")
var Airtable = require('airtable');
const getHome = require("../utils/getHomeScreen")
const qs = require("querystring")
var base = new Airtable({ apiKey: process.env.AIRTABLE }).base(process.env.BASE);

module.exports = async (event, recordID, id) => {
    let records = await base("Events")
        .select({
            filterByFormula: `{ID}='${event}'`
        }).all()
    let record = records[0]
    record.fields.RSVP ? null : record.fields.RSVP = []
    if (!record.fields.RSVP.includes(recordID)) {
        record.fields.RSVP.push(recordID)
        console.log(record.fields)
        base("Events")
            .update([{
                id: record.id,
                fields: {
                    RSVP: record.fields.RSVP
                }
            }])
        const modal = await getHome(id)
        axios.post("https://slack.com/api/views.publish", qs.stringify({
            user_id: id,
            token: process.env.SLACK,
            view: JSON.stringify(modal)
        }))
    }
}