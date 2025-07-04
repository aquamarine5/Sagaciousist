/*
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
 */
import cryptoJs from 'crypto-js';
import { ElNotification } from 'element-plus';
import { ref } from 'vue';

const xfyunConfig = {
    hostUrl: "wss://tts-api.xfyun.cn/v2/tts",
    host: "tts-api.xfyun.cn",
    appid: "994de8da",
    apiSecret: "Y2UwNTc2MjJlMDVjYmZmNGFkYWQwNWU1",
    apiKey: "20b03e7490607b93caaa96eb56650e92",
    uri: "/v2/tts",
}

var pending_ttslist = []

/**
 * @deprecated use ``SpeechController`` instead
 * @see SpeechControllerV3
 */
export default class SpeechController {
    /**
     * @deprecated
     * @param {import('vue').Ref<{},{}>} refsentence 
     */
    constructor(refsentence) {
        this.silentIsPending = false
        this.silentPendingList = []
        this.refsentence = refsentence
        this.lyricCurrentIndex = 0
        this.isTTSEnabled = true
        this.isTTSReading = false
        this._audioCtx = undefined
        this._textEncoder = undefined
        this._textDecoder = undefined
        this._audioSource = undefined
    }
    get textDecoder() {
        if (this._textDecoder == undefined) {
            this._textDecoder = new TextDecoder()
        }
        return this._textDecoder
    }

    get textEncoder() {
        if (this._textEncoder == undefined) {
            this._textEncoder = new TextEncoder()
        }
        return this._textEncoder
    }

    get audioContext() {
        if (this._audioCtx == undefined) {
            this._audioCtx = new window.AudioContext()
        }
        return this._audioCtx
    }

    /**
     * Built-in method. You should not call this method most times.
     * @param {string} audio audio by base64 string
     */
    ttsDecode(audio) {
        function base64ToArrayBuffer(base64) {
            const binaryString = window.atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }
        /**
         * 
         * @param {AudioContext} audioContext 
         */
        function playPcm(base64PcmData, sampleRate = 44100, endedcallback, audioContext, self) {
            const pcmArrayBuffer = base64ToArrayBuffer(base64PcmData);
            const pcmData = new Int16Array(pcmArrayBuffer);
            const audioBuffer = audioContext.createBuffer(1, pcmData.length, sampleRate);
            const channelData = audioBuffer.getChannelData(0);

            for (let i = 0; i < pcmData.length; i++) {
                channelData[i] = pcmData[i] / 32768;
            }
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.onended = () => {
                endedcallback(self)
            }
            source.connect(audioContext.destination);
            source.start();
            self._audioSource = source
        }
        playPcm(audio, 16000, this.ttsNext, this.audioContext, this)
    }

    /**
     * @param {SpeechController} self 
     */
    ttsNext(self) {
        console.log("pending_tts: ", JSON.parse(JSON.stringify(pending_ttslist)))
        console.log("status: ", self.refsentence.value)
        if (pending_ttslist[0].pending_audiodata[0].status == 2 ||
            (pending_ttslist[0].pending_audiodata.length == 1 &&
                pending_ttslist.length > 1 &&
                pending_ttslist[1].pending_audiodata.length > 0
            )
        ) {
            self.refsentence.value[pending_ttslist[0].index][pending_ttslist[0].partIndex].status = 2

            pending_ttslist.shift()
            if (pending_ttslist.length > 0 && pending_ttslist[0].pending_audiodata.length > 0) {
                self.refsentence.value[pending_ttslist[0].index][pending_ttslist[0].partIndex].status = 1
                self.isTTSReading = true
                console.log(1)
                // rs[pending_ttslist[0].index]=[{
                //     status:ref(1),
                //     text: pending_ttslist[0].content
                // }]
                self.ttsDecode(pending_ttslist[0].pending_audiodata[0].audio)
            } else {
                self.isTTSReading = false
                console.log(2)
            }
        } else {
            pending_ttslist[0].pending_audiodata.shift()
            if (pending_ttslist[0].pending_audiodata.length > 0) {
                self.isTTSReading = true
                console.log(3)
                // rs[pending_ttslist[0].index].push({
                //     status:ref(1),
                //     text: pending_ttslist[0].content
                // })
                self.ttsDecode(pending_ttslist[0].pending_audiodata[0].audio)
            } else {
                self.isTTSReading = false
                console.log(4)
            }
        }
    }

    ttsRead() {
        if (this.isTTSReading) {
            return
        };
        this.isTTSReading = true;
        if (pending_ttslist.length > 0 && pending_ttslist[0].pending_audiodata.length > 0) {
            console.log("status: ", this.refsentence.value)
            console.log("pending_tts: ", JSON.parse(JSON.stringify(pending_ttslist)))
            this.refsentence.value[pending_ttslist[0].index][pending_ttslist[0].partIndex].status = 1
            this.ttsDecode(pending_ttslist[0].pending_audiodata[0].audio)
        }
    }

    ttsSend(speechData) {
        function getAuthStr(date) {
            let signatureOrigin = `host: ${xfyunConfig.host}\ndate: ${date}\nGET ${xfyunConfig.uri} HTTP/1.1`
            let signatureSha = cryptoJs.HmacSHA256(signatureOrigin, xfyunConfig.apiSecret)
            let signature = cryptoJs.enc.Base64.stringify(signatureSha)
            let authorizationOrigin =
                `api_key="${xfyunConfig.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
            let authStr = cryptoJs.enc.Base64.stringify(cryptoJs.enc.Utf8.parse(authorizationOrigin))
            return authStr
        }
        let date = (new Date().toUTCString())
        const wssUrl = xfyunConfig.hostUrl + "?authorization="
            + getAuthStr(date) + "&date=" + date + "&host=" + xfyunConfig.host
        let ws = new WebSocket(wssUrl)
        console.log("ttsSend", speechData)
        this.lyricCurrentIndex += 1;
        let lcindex = this.lyricCurrentIndex
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
            ElNotification({
                title: "TTS连接发生错误",
                type: "error",
                message: err
            })
        }
        let previousCed = 0
        let ced = '-1'
        let partIndex = 0
        var ttsnode = undefined
        ws.onmessage = (data, err) => {
            if (err) {
                console.error(err)
                return
            }
            let res = JSON.parse(data.data)
            if (res.code != 0) {
                console.error(res.code.toString() + " " + res.message)
                ws.close()
                return
            }
            let text = this.textDecoder.decode(this.textEncoder.encode(speechData.content).subarray(previousCed, res.data.ced))
            if (res.data.status == 1) {
                if (res.data.ced != ced) {
                    let rs = this.refsentence.value
                    if (rs[lcindex] == undefined) {
                        rs[lcindex] = [{
                            status: ref(0),
                            text: text
                        }]
                    } else {
                        rs[lcindex].push({
                            status: ref(0),
                            text: text
                        })
                    }
                    ced = res.data.ced
                    pending_ttslist.push({
                        "index": lcindex,
                        "partIndex": partIndex,
                        "ced": ced,
                        "content": text,
                        pending_audiodata: [{
                            "audio": res.data.audio,
                            "status": 1
                        }]
                    })
                    partIndex += 1
                    ttsnode = pending_ttslist[pending_ttslist.length - 1]
                    previousCed = ced
                    console.log("ttsnode: ", ttsnode)
                    this.ttsRead()
                } else {
                    ttsnode.pending_audiodata.push({
                        "audio": res.data.audio,
                        "status": 1
                    })
                    this.ttsRead()
                }
            }
            if (res.code == 0 && res.data.status == 2) {
                if (ttsnode == undefined) {
                    let rs = this.refsentence.value
                    if (rs[lcindex] == undefined) {
                        rs[lcindex] = [{
                            status: ref(1),
                            text: text
                        }]
                    } else {
                        rs[lcindex].push({
                            status: ref(1),
                            text: text
                        })
                    }
                    pending_ttslist.push({
                        "index": lcindex,
                        "partIndex": 0,
                        "ced": ced,
                        "content": text,
                        pending_audiodata: [{
                            "audio": res.data.audio,
                            "status": 1
                        }]
                    })
                    ttsnode = pending_ttslist[pending_ttslist.length - 1]
                } else {
                    ttsnode.pending_audiodata.push({
                        "audio": res.data.audio,
                        "status": 2
                    })
                }
                this.ttsRead()
                ws.close()
            }
        }
    }
    silentNext() {
        this.silentIsPending = true
        if (this.silentPendingList.length > 0) {
            this.refsentence.value[this.lyricCurrentIndex] = [{
                status: ref(1),
                text: this.silentPendingList[0]
            }]
            this.lyricCurrentIndex += 1
            this.silentPendingList.shift()
            if (this.silentPendingList.length > 0) {
                setTimeout(() => {
                    this.silentNext()
                    console.log("X", JSON.parse(JSON.stringify(this.silentPendingList)))
                }, 500)
            } else {
                this.silentIsPending = false
            }
        } else {
            this.silentIsPending = false
        }
    }
    addSentence(text) {
        console.log("addSentence", text)
        if (localStorage.getItem('silent') == 'true') {
            this.silentPendingList.push(text)
            console.log(this.silentIsPending)
            if (!this.silentIsPending) {
                this.silentNext()
                console.log(1)
            }
        } else {
            this.ttsSend({
                content: text,
                status: ref(this.isTTSEnabled ? 0 : 2),
                istts: this.isTTSEnabled
            })
        }
    }

    ttsClear() {
        this.lyricCurrentIndex = 0
        this.isTTSEnabled = true
        this.isTTSReading = false
        pending_ttslist = []
        this.silentPendingList = []
        this.silentIsPending = false
        this.ttsStop()
    }

    ttsStop() {
        if (this._audioSource != undefined)
            this._audioSource.stop()
    }
}