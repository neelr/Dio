const axios = require("axios")
const FormData = require("form-data")
var Airtable = require('airtable');
const qs = require("querystring")
var base = new Airtable({ apiKey: process.env.AIRTABLE }).base(process.env.BASE);

module.exports = async event => {
    console.log(event)
    if (event.user == "U012LDSJ18W") return
    let record = await base("Updates").find(event.text).catch(e => console.log(e))
    if (!record || record.get("SlackID") != event.user) {
        axios.post("https://slack.com/api/chat.postMessage", qs.stringify({
            channel: event.user,
            token: process.env.SLACK,
            text: "Could not upload attachment! Update not found!"
        }))
        return
    }
    axios.post("https://slack.com/api/chat.postMessage", qs.stringify({
        channel: event.user,
        token: process.env.SLACK,
        text: "Uploading :loading:"
    }))
    record.fields.Attachments ? null : record.fields.Attachments = []
    let attachments = event.files.map(file => {
        return new Promise(async (res, rej) => {
            let data = await axios({
                url: file.url_private_download,
                headers: { "Authorization": `Bearer ${process.env.SLACK}` },
                method: "get",
                responseType: 'arraybuffer'
            })
            let formData = new FormData();
            formData.append('name', file.name);
            formData.append('file', Buffer.from(data.data, "utf-8"), {
                "Content-Type": file.mimetype,
                filename: file.name
            });
            let uri = await axios.create({
                headers: formData.getHeaders()
            }).post('http://uguu.se/api.php?d=upload-tool', formData).catch(e => console.log(e))

            if (uri.data.includes("File type not allowed, sorry about that.")) {
                await axios.post("https://slack.com/api/chat.postMessage", qs.stringify({
                    channel: event.user,
                    token: process.env.SLACK,
                    text: `Couldn't upload \`${file.name}\`. Invalid file type.`
                }))
                res(null)
                return
            }
            res({
                url: uri.data,
                filename: file.name
            })
        })
    })

    attachments = await Promise.all(attachments)

    attachments = attachments.filter(v => v != null)

    await base("Updates").update([{
        id: record.id,
        fields: {
            Attachments: [
                ...record.fields.Attachments,
                ...attachments
            ]
        }
    }])

    axios.post("https://slack.com/api/chat.postMessage", qs.stringify({
        channel: event.user,
        token: process.env.SLACK,
        text: "Done! :partyparrot:"
    }))
}