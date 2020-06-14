const axios = require("axios")
const qs = require("querystring")

module.exports = (user, recordID, trigger) => {
    axios.post("https://slack.com/api/views.open", qs.stringify({
        user_id: user,
        token: process.env.SLACK,
        view: JSON.stringify({
            "private_metadata": `new-meeting_${recordID}`,
            "title": {
                "type": "plain_text",
                "text": "Create Meeting"
            },
            "submit": {
                "type": "plain_text",
                "text": "Send"
            },
            "blocks": [
                {
                    "type": "input",
                    "element": {
                        "type": "datepicker",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Date for Meeting",
                            "emoji": true
                        }
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Date",
                        "emoji": true
                    }
                },
                {
                    "type": "input",
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "ml_input",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "24hr Time during the day (ex. 7:31 or 14:32) in GMT"
                        }
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Time",
                        "emoji": true
                    }
                },
                {
                    "type": "input",
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "ml_input",
                        "multiline": true,
                        "placeholder": {
                            "type": "plain_text",
                            "text": "What you hope to do during the meeting and what you want to discuss"
                        }
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Note"
                    }
                }
            ],
            "type": "modal"
        }),
        trigger_id: trigger
    }))
}