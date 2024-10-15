import cryptoJs from 'crypto-js';

const audioContext = new (window.AudioContext)();
var pending_ttslist = []

export default class SpeechController {
    constructor(refsentence) {
        this.refsentence = refsentence
        this.lyricCurrectIndex = 0
        this.isTTSEnabled = true
        this.isTTSReading = false
    }
    ttsNext() {
        if (pending_ttslist[0].pending_audiodata[0].status == 2) {
            pending_ttslist[0].speechData.status.value = 2
            pending_ttslist.shift()
            if (pending_ttslist.length > 0 && pending_ttslist[0].pending_audiodata.length > 0) {
                pending_ttslist[0].speechData.status.value = 1
                this.isTTSReading = true
                this.ttsDecode(pending_ttslist[0].pending_audiodata[0].audio)
            } else {
                this.isTTSReading = false
            }
        } else {
            pending_ttslist[0].pending_audiodata.shift()
            if (pending_ttslist[0].pending_audiodata.length > 0) {
                this.isTTSReading = true
                this.ttsDecode(pending_ttslist[0].pending_audiodata[0].audio)
            } else {
                this.isTTSReading = false
            }
        }
    }
    ttsRead() {
        if (isTTSReading) return;
        this.ttsNext()
    }
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
        function playPcm(base64PcmData, sampleRate = 44100,endedcallback) {
            const pcmArrayBuffer = base64ToArrayBuffer(base64PcmData);
            const pcmData = new Int16Array(pcmArrayBuffer);
            const audioBuffer = audioContext.createBuffer(1, pcmData.length, sampleRate); // 创建 AudioBuffer
            const channelData = audioBuffer.getChannelData(0);

            for (let i = 0; i < pcmData.length; i++) {
                channelData[i] = pcmData[i] / 32768;
            }
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.onended = endedcallback
            source.connect(audioContext.destination);
            source.start();
        }
        playPcm(audio, 16000, this.ttsNext)
    }
    ttsSend(speechData) {
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
        let previousCed = 0
        let ced = -1
        ws.onmessage = (data, err) => {
            console.log("websocket message.")
            if (err) {
                console.error(err)
                return
            }
            let res = JSON.parse(data.data)
            console.log(res)

            if (res.code != 0) {
                console.error(res.code.toString() + " " + res.message)
                ws.close()
                return
            }
            if (res.data.status == 1) {
                if (res.data.ced != ced) {
                    let rs=this.refsentence.value
                    let text=speechData.content.substring(previousCed / 3, ced / 3)
                    if(ced==-1){
                        rs[res.data.ced]=[{
                            status:1,
                            text:text
                        }]
                    }else{
                        rs[res.data.ced].push({
                            status:1,
                            text:text
                        })
                    }
                    ced = res.data.ced
                    pending_ttslist.push({
                        "ced": ced,
                        "content": text,
                        pending_audiodata: [{
                            "audio": res.data.audio,
                            "status": 1
                        }]
                    })
                    previousCed = ced
                    
                    ttsRead()
                } else {
                    pending_ttslist[ced].pending_audiodata.push({
                        "audio": res.data.audio,
                        "status": 1
                    })
                    ttsRead()
                }
            }
            if (res.code == 0 && res.data.status == 2) {
                pending_ttslist[ced].pending_audiodata.push({
                    "audio": res.data.audio,
                    "status": 2
                })
                ttsRead()
                ws.close()
            }
        }

    }
    addSentence(text) {
        console.log(text)
        this.ttsSend({
            content: text,
            index: lyricCurrectIndex,
            status: ref(isTTSEnabled ? 0 : 2),
            istts: this.isTTSEnabled
        })
        lyricCurrectIndex += 1
    }
}