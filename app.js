require("dotenv").config()
const express = require("express")
const qs = require("querystring")
const axios = require("axios")
const getHome = require("./utils/getHomeScreen")
const unrsvpHandle = require("./handles/unrsvp")
const createMeetingHandle = require("./handles/createMeeting")
const createUpdateHandle = require("./handles/createUpdate")
const createMeetingButtonHandle = require("./handles/newMeetingButton")
const createUpdateButtonHandle = require("./handles/newUpdateButton")
const meetingDoneButtonHandle = require("./handles/meetingDoneButton")
const meetingApproveButtonHandle = require("./handles/meetingApproveButton")
const meetingDenyButtonHandle = require("./handles/meetingDenyButton")
const attachmentMessage = require("./handles/attachmentMessage")
const rsvpHandle = require("./handles/rsvp")
const app = express()
app.use(express.json())
app.use(express.urlencoded())

app.post("/api/events", async (req, res) => {
    if (req.body.token == process.env.TOKEN) {
        //console.log(req.body)
        if (!req.body.challenge) {
            switch (req.body.event.type) {
                case "app_home_opened":
                    const modal = await getHome(req.body.event.user)
                    axios.post("https://slack.com/api/views.publish", qs.stringify({
                        user_id: req.body.event.user,
                        token: process.env.SLACK,
                        view: JSON.stringify(modal)
                    }))
                    break
                case "message":
                    attachmentMessage(req.body.event)
                    break
            }
        }
        res.send(req.body.challenge)
    }
})

app.post("/api/blocks", (req, res) => {
    let payload = JSON.parse(req.body.payload)
    switch (payload.type) {
        case "view_submission":
            switch (payload.view.private_metadata.split("_")[0]) {
                case "new-meeting":
                    createMeetingHandle(payload)
                    res.send({
                        "response_action": "clear"
                    })
                    break
                case "new-update":
                    createUpdateHandle(payload)
                    res.send({
                        "response_action": "clear"
                    })
                    break
            }
            break
        case "block_actions":
            let value = payload.actions[0].value
            let type = value.split("_")
            if (payload.token != process.env.TOKEN)
                return

            switch (type[0]) {
                case "unrsvp":
                    unrsvpHandle(type[1], type[2], payload.user.id)
                    break
                case "rsvp":
                    rsvpHandle(type[1], type[2], payload.user.id)
                    break
                case "new-meeting":
                    createMeetingButtonHandle(payload.user.id, type[1], payload.trigger_id)
                    break
                case "new-update":
                    createUpdateButtonHandle(payload.user.id, type[1], payload.trigger_id)
                    break
                case "completed-meeting":
                    meetingDoneButtonHandle(type[1], payload.user.id)
                    break
                case "approve":
                    meetingApproveButtonHandle(type[1], payload.user.id)
                    break
                case "decline":
                    meetingDenyButtonHandle(type[1], payload.user.id)
                    break
                default:
                    console.log(type)
            }
            res.sendStatus(200)
    }
})

app.listen(3000, () => console.log("On port 3000"))