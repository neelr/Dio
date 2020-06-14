const axios = require("axios")
var Airtable = require('airtable');
const getHome = require("../utils/getHomeScreen")
const qs = require("querystring")
var base = new Airtable({ apiKey: process.env.AIRTABLE }).base(process.env.BASE);

module.exports = async (payload) => {
    let [title, note] = Object.values(payload.view.state.values).map(v => Object.values(v)[0])
    let load = payload.view.private_metadata.split("_")
    await base("Updates")
        .create([{
            fields: {
                Person: [load[1]],
                Title: title.value,
                Update: note.value
            }
        }]).catch(e => console.log(e))
    const modal = await getHome(payload.user.id)
    axios.post("https://slack.com/api/views.publish", qs.stringify({
        user_id: payload.user.id,
        token: process.env.SLACK,
        view: JSON.stringify(modal)
    }))
}