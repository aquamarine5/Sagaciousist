import cryptoJs from 'crypto-js';

const audioContext = new (window.AudioContext)();
var pending_ttslist=[]

export default {
    lyricCurrectIndex:0,
    isTTSEnabled:true,
    ttsDecode: (audio, speechData) => {
        function base64ToArrayBuffer(base64) {
            const binaryString = window.atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }
        function playPcm(base64PcmData, sampleRate = 44100) {

            const pcmArrayBuffer = base64ToArrayBuffer(base64PcmData);
            const pcmData = new Int16Array(pcmArrayBuffer);
            const audioBuffer = audioContext.createBuffer(1, pcmData.length, sampleRate); // 创建 AudioBuffer
            const channelData = audioBuffer.getChannelData(0);

            for (let i = 0; i < pcmData.length; i++) {
                channelData[i] = pcmData[i] / 32768;
            }
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.onended = () => {
                pending_ttslist.shift()
                speechData.status.value = 2
                if (pending_ttslist.length == 0) {
                    isTTSServiceWorking = false
                }
                else {
                    ttsSpeak(pending_ttslist[0])
                }
            }
            source.connect(audioContext.destination);
            source.start();
        }
        playPcm(audio, 16000)
    },
    ttsSend: (speechData) => {
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
        let ced=-1
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
                if(res.data.ced!=ced){
                    ced=res.data.ced
                }
            }
            if (res.code == 0 && res.data.status == 2) {
                ws.close()
            }
            ttsDecode(res.data.audio, speechData)
        }

    },

    builtinAddSentence: () => {
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
    },
    addSentence:(text,tts=true)=>{
        console.log(text)
        this.ttsSend({
            content: text,
            index: lyricCurrectIndex,
            status: ref(isTTSEnabled ? 0 : 2),
            istts: tts
        })
    },
    _addSentence: (text, tts = true) => {
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
    },
    ttsStart: () => {
        isTTSServiceWorking = true
        ttsSpeak(pending_ttslist[0])
    },
    ttsSpeak: (speechData) => {
        speechData.status.value = 1
        ttsSend(speechData)
    }
}