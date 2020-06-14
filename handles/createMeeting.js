const axios = require("axios")
var Airtable = require('airtable');
const moment = require("moment")
const getHome = require("../utils/getHomeScreen")
const qs = require("querystring")
var base = new Airtable({ apiKey: process.env.AIRTABLE }).base(process.env.BASE);

module.exports = async (payload) => {
    let [date, time, note] = Object.values(payload.view.state.values).map(v => Object.values(v)[0])
    let load = payload.view.private_metadata.split("_")
    time = time.value.split(":").map(v => Number(v))
    date = `${moment(date.selected_date).format("YYYY-MM-DD")}T${time[0] < 10 ? "0" : ""}${time[0]}:${time[1] < 10 ? "0" : ""}${time[1]}:00.000Z`;
    await base("Meetings")
        .create([{
            fields: {
                MeetingDate: date,
                Mentee: [load[1]],
                Note: note.value,
                Status: "Pending",
            }
        }])
    const modal = await getHome(payload.user.id)
    axios.post("https://slack.com/api/views.publish", qs.stringify({
        user_id: payload.user.id,
        token: process.env.SLACK,
        view: JSON.stringify(modal)
    }))
}