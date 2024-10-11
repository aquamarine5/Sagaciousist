<script setup>
import cryptoJs from 'crypto-js';
import { marked } from 'marked';
import PCMPlayer from 'pcm-player';
import { ref } from 'vue';


const xfyunConfig = {
    hostUrl: "wss://tts-api.xfyun.cn/v2/tts",
    host: "tts-api.xfyun.cn",
    appid: "994de8da",
    apiSecret: "Y2UwNTc2MjJlMDVjYmZmNGFkYWQwNWU1",
    apiKey: "20b03e7490607b93caaa96eb56650e92",
    uri: "/v2/tts",
}

const props = defineProps(["isloading"])
var sentenceStatus = [
    'lyricful_before_read',
    'lyricful_reading',
    'lyricful_after_read'
]

var lastTimeout = new Date().getTime()
var isTTSEnabled = true
var lyricCurrectIndex = 0
var isTTSServiceWorking = false

var lyricful_data = ref([])
var pending_ttslist = []
var pending_addSentenceList = []
const ADD_SENTENCE_DURATION = 500

function _ttsDecode(audio, speechData) {

    const pcmPlayer = new PCMPlayer({
        channels: 1,
        flushTime: 1000,
        sampleRate: 16000,
        inputCodec: "Int16",
        onended: (node, event) => {
            console.log(2)
        },
    })
    pcmPlayer.feed(new Uint8Array(audio).buffer)
    pcmPlayer.continue().then(() => {
        console.log(3)
        pending_ttslist.shift()
        console.log(speechData)
        speechData.status.value = 2
        if (pending_ttslist.length == 0) {
            isTTSServiceWorking = false
        }
        else {
            ttsSpeak(pending_ttslist[0])
        }
    })
}

function _ttsSend(speechData) {
    function getAuthStr(date) {
        let signatureOrigin = `host: ${xfyunConfig.host}\ndate: ${date}\nGET ${xfyunConfig.uri} HTTP/1.1`
        let signatureSha = cryptoJs.HmacSHA256(signatureOrigin, xfyunConfig.apiSecret)
        let signature = cryptoJs.enc.Base64.stringify(signatureSha)
        let authorizationOrigin = `api_key="${xfyunConfig.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
        let authStr = cryptoJs.enc.Base64.stringify(cryptoJs.enc.Utf8.parse(authorizationOrigin))
        return authStr
    }
    let date = (new Date().toUTCString())
    const wssUrl = xfyunConfig.hostUrl + "?authorization=" + getAuthStr(date) + "&date=" + date + "&host=" + xfyunConfig.host
    let ws = new WebSocket(wssUrl)
    console.log(ws)
    ws.onopen = () => {
        console.log("websocket connect!")
        ws.send(JSON.stringify({
            "common": {
                "app_id": xfyunConfig.appid
            },
            "business": {
                "aue": "raw",
                "auf": "audio/L16;rate=16000",
                "vcn": "xiaoyan",
                "tte": "UTF8"
            },
            "data": {
                "text": cryptoJs.enc.Base64.stringify(cryptoJs.enc.Utf8.parse(speechData.content)),
                "status": 2
            }
        }))
    }

    ws.onclose = () => {
        console.warn('connect close!')
    }

    ws.onerror = (err) => {
        console.error("websocket connect err: " + err)
    }

    ws.onmessage = (data, err) => {
        console.log("websocket message.")
        if (err) {
            console.error(err)
            return
        }
        let res = JSON.parse(data.data)
        if (res.data.status == 1) return
        if (res.code != 0) {
            console.error(res.code.toString() + " " + res.message)
            ws.close()
            return
        }
        if (res.code == 0 && res.data.status == 2) {
            ws.close()
        }
        _ttsDecode(data.audio, speechData)
    }

}

function builtinAddSentence() {
    lyricful_data.value.push(pending_addSentenceList[0])
    pending_ttslist.push(pending_addSentenceList[0])
    if (pending_addSentenceList[0].istts) {
        if (!isTTSServiceWorking) {
            ttsStart()
        }
    }
    lastTimeout = new Date().getTime()
    pending_addSentenceList.shift()
    if (pending_addSentenceList.length > 0)
        setTimeout(builtinAddSentence, ADD_SENTENCE_DURATION)
}

function addSentence(text, tts = true) {
    console.log(text)
    let lyricSentence = {
        content: text,
        index: lyricCurrectIndex,
        status: ref(isTTSEnabled ? 0 : 2),
        istts: tts
    }
    lyricCurrectIndex += 1
    var ct = new Date().getTime()
    if (ct - lastTimeout <= ADD_SENTENCE_DURATION) {
        pending_addSentenceList.push(lyricSentence)
        console.log(1)
        if (pending_addSentenceList.length <= 1)
            setTimeout(builtinAddSentence, ct - lastTimeout)
    } else {
        if (pending_addSentenceList.length != 0) {
            pending_addSentenceList.push(lyricSentence)
            console.log(2)
            if (pending_addSentenceList.length <= 1)
                setTimeout(builtinAddSentence, ADD_SENTENCE_DURATION)
        } else {
            lyricful_data.value.push(lyricSentence)
            pending_ttslist.push(lyricSentence)
            if (tts) {
                if (!isTTSServiceWorking) {
                    ttsStart()
                }
            }
            lastTimeout = new Date().getTime()
        }
    }
    return lyricCurrectIndex - 1
}
function ttsStart() {
    isTTSServiceWorking = true
    ttsSpeak(pending_ttslist[0])
}
function _ttsSpeak(speechData) {
    let speechUtterance = new SpeechSynthesisUtterance(speechData.content)
    speechData.status.value = 1
    speechUtterance.onend = event => {
        pending_ttslist.shift()
        speechData.status.value = 2
        if (pending_ttslist.length == 0) {
            isTTSServiceWorking = false
            console.log("OK")
        }
        else {
            ttsSpeak(pending_ttslist[0])
        }
    }
    speechUtterance.rate = 1.5
    speechSynthesis.speak(speechUtterance)
}
function ttsSpeak(speechData) {
    speechData.status.value = 1
    _ttsSend(speechData)
}
function ttsStop() {
    speechSynthesis.cancel()
    pending_ttslist = []
    isTTSServiceWorking = false
    for (let index = 0; index < lyricful_data.value.length; index++) {
        lyricful_data.value[index].status = 2;
    }
}
function clearAllLyrics() {
    speechSynthesis.cancel()
    lyricful_data.value = []
    pending_ttslist = []
    isTTSServiceWorking = false
}
defineExpose({
    ttsSpeak,
    ttsStop,
    ttsStart,
    addSentence,
    clearAllLyrics
})
</script>

<template>
    <div class="lyricful_container">
        <div :class="'lyricful_sentence ' + sentenceStatus[sentence.status]" v-for="sentence in lyricful_data"
            :id="sentence.index">
            <div v-html="marked(sentence.content)">
            </div>
        </div>
    </div>
</template>

<style>
@keyframes fadeIn {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

.lyricful_container {
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: 5px;
}

.lyricful_sentence {
    animation: fadeIn .3s ease-in-out;
    transition: color .4s ease-in-out;
}

.lyricful_reading {
    font-weight: 600;
    color: #000;

}

.lyricful_after_read {
    font-weight: 500;
    color: #000;
}

.lyricful_before_read {
    font-weight: 500;
    color: rgb(130, 130, 130);
}
</style>