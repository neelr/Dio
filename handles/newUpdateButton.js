const axios = require("axios")
const qs = require("querystring")

module.exports = (user, recordID, trigger) => {
    axios.post("https://slack.com/api/views.open", qs.stringify({
        user_id: user,
        token: process.env.SLACK,
        view: JSON.stringify({
            private_metadata: `new-update_${recordID}`,
            "type": "modal",
            "title": {
                "type": "plain_text",
                "text": "Create Update",
                "emoji": true
            },
            "submit": {
                "type": "plain_text",
                "text": "Submit",
                "emoji": true
            },
            "close": {
                "type": "plain_text",
                "text": "Cancel",
                "emoji": true
            },
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "*Create an Update!*\n Here you would inform us on various developments in your project! You can tell us about problems that you went through, cool uses for your hardware, or just generally how you did this week!"
                    }
                },
                {
                    "type": "input",
                    "element": {
                        "type": "plain_text_input"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Title of Update",
                        "emoji": true
                    }
                },
                {
                    "type": "input",
                    "element": {
                        "type": "plain_text_input",
                        "multiline": true
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Notes for Update",
                        "emoji": true
                    }
                }
            ]
        }),
        trigger_id: trigger
    }))
}