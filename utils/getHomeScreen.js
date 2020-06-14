var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE }).base(process.env.BASE);


const mentorScreen = async (userId) => {
    let records = await base("Confirmed Mentors").select({
        filterByFormula: `{SlackID}='${userId}'`
    }).all()
    if (records.length == 0) {
        return {
            "type": "home",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "*You seem to be in the wrong place....*\n This is a portal meant for Summer of Making people. If you think you should be seeing something here, contact <@UJYDFQ2QL>"
                    }
                }
            ]
        }
    }
    let mentor = records[0]

    let meetings = await base("Meetings").select({
        filterByFormula: `{MentorSlackID}='${mentor.fields.SlackID}'`
    }).all()

    meetings.reverse()

    let meetingsList = []
    meetings.map(v => {
        console.log(v.fields.Status == "Done" || v.fields.Status == "Denied")
        if (v.fields.Status == "Done" || v.fields.Status == "Denied") return
        let day = new Date(v.fields.MeetingDate)
        day = (day.getTime() / 1000).toFixed(0)

        let payload = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*Meeting* @ <!date^${day}^{date}|x> <!date^${day}^{time}|x> from <@${v.fields.MenteeSlackID}>\n${v.fields.Note}`
            }

        }

        if (v.fields.Status == "Pending") {
            meetingsList.push(payload)
            meetingsList.push({
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Approve",
                            "emoji": true
                        },
                        "style": "primary",
                        "value": `approve_${v.id}`,
                        "confirm": {
                            "title": {
                                "type": "plain_text",
                                "text": "Are you sure?"
                            },
                            "text": {
                                "type": "mrkdwn",
                                "text": "This will let the mentee know that you can make it to the meeting!"
                            },
                            "confirm": {
                                "type": "plain_text",
                                "text": "Yes Ofc"
                            },
                            "deny": {
                                "type": "plain_text",
                                "text": "Stop, I've changed my mind!"
                            }
                        }
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Deny",
                            "emoji": true
                        },
                        "style": "danger",
                        "value": `decline_${v.id}`,
                        "confirm": {
                            "title": {
                                "type": "plain_text",
                                "text": "Are you sure?"
                            },
                            "text": {
                                "type": "mrkdwn",
                                "text": "This will alert the mentee that you cannot make it to this meeting!"
                            },
                            "confirm": {
                                "type": "plain_text",
                                "text": "Yes"
                            },
                            "deny": {
                                "type": "plain_text",
                                "text": "Stop, I've changed my mind!"
                            }
                        }
                    }
                ]
            })
        } else {
            payload.text.text += `\n\n *You ${v.fields.Status} this meeting!*`
            meetingsList.push(payload)
        }
    })

    let updates = await base("Updates").select({
        filterByFormula: `{Mentor}='${mentor.fields.SlackID}'`
    }).all()

    updates = updates.map(v => {
        let day = new Date(v.fields.DateCreated)
        day = (day.getTime() / 1000).toFixed(0)
        attachments = v.fields.Attachments ? "*Attachments:*\n" : ""
        if (attachments != "") {
            v.fields.Attachments.map(v => {
                attachments += `<${v.url}|${v.filename}>\n`
            })
        }
        return {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*${v.fields.Title}* @ <!date^${day}^{date}|x> <!date^${day}^{time}|x> from <@${v.fields.SlackID}>\n${v.fields.Update}\n\n${attachments}`
            }
        }
    })
    updates.reverse()
    console.log("MENTORRR")
    return {
        "type": "home",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Welcome to _Summer of Making_*, Mentor Page!\n\nThis is a page where you can interact with your mentee! You can check on what meetings they have requested, and all their project updates!"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Your Mentee*: ${mentor.fields.MenteeSlackID.map(v => `<@${v}>`).join(", ")}\nFeel free to DM them and have a conversation! Make sure to catch what times you both are free for meetings, and what type of help they would want/you would give.`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Meetings*"
                }
            },
            {
                "type": "divider"
            },
            ...meetingsList,
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Updates!*"
                }
            },
            ...updates
        ]
    }
}


module.exports = async (userId) => {
    console.log(userId)
    let records = await base("Confirmed People")
        .select({
            filterByFormula: `{SlackID}='${userId}'`
        }).all().catch(e => console.log(e))
    if (records.length == 0) {
        return mentorScreen(userId)
    }
    const user = records[0].fields
    let events = await base("Events").select().all()
    let eventList = []
    events.map(v => {
        if (v.fields.Done) return
        let day = new Date(v.fields.Time)
        day = (day.getTime() / 1000).toFixed(0)
        eventList.push(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*${v.fields.Title} @ <!date^${day}^{date}|x> <!date^${day}^{time}|x>*\n${v.fields.Description}`
                },
                "accessory": {
                    "type": "image",
                    "image_url": v.fields.Image[0].url,
                    "alt_text": "credit card"
                }
            }
        )
        if (v.fields.RSVP && v.fields.RSVP.includes(records[0].id)) {
            eventList.push(
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Can't Make it",
                                "emoji": true
                            },
                            "style": "danger",
                            "value": `unrsvp_${v.fields.ID}_${records[0].id}`,
                            confirm: {
                                "title": {
                                    "type": "plain_text",
                                    "text": "Are you sure?"
                                },
                                "text": {
                                    "type": "mrkdwn",
                                    "text": "This will let us know you won't make it to the event!"
                                },
                                "confirm": {
                                    "type": "plain_text",
                                    "text": "Yes Ofc"
                                },
                                "deny": {
                                    "type": "plain_text",
                                    "text": "Stop, I've changed my mind!"
                                }
                            }
                        }
                    ]
                }
            )
            return
        }
        eventList.push(
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "RSVP",
                            "emoji": true
                        },
                        "style": "primary",
                        "value": `rsvp_${v.fields.ID}_${records[0].id}`,
                        confirm: {
                            "title": {
                                "type": "plain_text",
                                "text": "Are you sure?"
                            },
                            "text": {
                                "type": "mrkdwn",
                                "text": "This will sign you up for the event!"
                            },
                            "confirm": {
                                "type": "plain_text",
                                "text": "Yes Ofc"
                            },
                            "deny": {
                                "type": "plain_text",
                                "text": "Stop, I've changed my mind!"
                            }
                        }
                    }
                ]
            }
        )
    })
    meetingsPage = []
    if (user.MentorID.length != 0) {
        let meetings = await base("Meetings").select({
            filterByFormula: `AND({MenteeSlackID}='${user.SlackID}',NOT({Status}='Done'))`
        }).all()
        let meetingsList = []
        meetings.reverse()
        meetings.map(v => {
            let day = new Date(v.fields.MeetingDate)
            day = (day.getTime() / 1000).toFixed(0)
            let payload = {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Meeting @ <!date^${day}^{date}|x> <!date^${day}^{time}|x>*\n${v.fields.Note}`
                }
            }
            if (v.fields.Status == "Pending") {
                payload.text.text += "\n\n*Pending Confirmation or Denial...*"
            } else if (v.fields.Status == "Denied") {
                payload.accessory = {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Denied! Click this to remove!",
                        "emoji": true
                    },
                    "style": "danger",
                    "value": `completed-meeting_${v.id}`

                }
            } else if (v.fields.Status == "Accepted") {
                payload.accessory = {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Accepted! Click if finished!",
                        "emoji": true
                    },
                    "style": "primary",
                    "value": `completed-meeting_${v.id}`

                }
            }
            payload.text.text += "\n-------------------------------"
            meetingsList.push(payload)
        })
        meetingsPage = [{
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Mentor Meetings!*"
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Schedule a Meeting!",
                        "emoji": true
                    },
                    "style": "primary",
                    "value": `new-meeting_${records[0].id}`
                }
            ]
        },
        ...meetingsList,
        {
            "type": "divider"
        },
        ]
    }
    let updates = await base("Updates").select({
        filterByFormula: `{SlackID}='${user.SlackID}'`
    }).all()
    updates = updates.map(v => {
        let day = new Date(v.fields.DateCreated)
        day = (day.getTime() / 1000).toFixed(0)
        attachments = v.fields.Attachments ? "*Attachments:*\n" : ""
        v.fields.Attachments.map(v => {
            attachments += `<${v.url}|${v.filename}>\n`
        })
        return {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*${v.fields.Title} @ <!date^${day}^{date}|x> <!date^${day}^{time}|x>* \`${v.id}\`\n\n${v.fields.Update}\n\n${attachments}\n------------`
            }
        }
    })
    updates.reverse()
    return {
        "type": "home",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Welcome to _Summer of Making_*!\n\nThis is a basic portal where summer of hacks people can get caught up on the latest news and events! Also here you can schedule meetings with your mentor and updates on your project!"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Your Mentor: ${user.MentorID.length != 0 ? `<@${user.MentorID}>` : "N/A"}*\n${user.MentorDescription}`
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Upcoming Events*"
                }
            },
            {
                "type": "divider"
            },
            ...eventList,
            {
                "type": "divider"
            },
            ...meetingsPage,
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Your Updates!*\nMake updates on your project! The ID next to the date is the id you can use to upload any attachments! Just DM this bot with any attachments (video, images, files) and the id as the message (no special formatting or anything), and it'll automatically upload them!"
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Create an Update!",
                            "emoji": true
                        },
                        "style": "primary",
                        "value": `new-update_${records[0].id}`
                    }
                ]
            },
            ...updates
        ]
    }
}