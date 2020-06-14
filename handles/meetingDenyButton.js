const axios = require("axios")
var Airtable = require('airtable');
const getHome = require("../utils/getHomeScreen")
const qs = require("querystring")
var base = new Airtable({ apiKey: process.env.AIRTABLE }).base(process.env.BASE);

module.exports = async (record, userID) => {
    await base("Meetings").update([{
        id: record,
        fields: {
            Status: "Denied"
        }
    }])
    const modal = await getHome(userID)
    axios.post("https://slack.com/api/views.publish", qs.stringify({
        user_id: userID,
        token: process.env.SLACK,
        view: JSON.stringify(modal)
    }))
}