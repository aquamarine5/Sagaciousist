/*
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
 */
import { ref } from "vue";
import axios from "axios";

const MUTE_DELAY = 100

/**
 * @typedef {Object} Audiodata
 * @property {string} text
 * @property {string} base64str
 * @property {boolean} isend
 * @property {boolean} issplit
 * @property {number} index
 */

export default class SpeechControllerV3 {
    /**
     * 
     * @param {function} scrollFunction 
     */
    constructor(scrollFunction) {
        this.refsentence = null
        this._audioContext = null
        this.pendingTTSList = []
        this.isTTSPlaying = false
        this.isMuteDisplaying = false
        this.isPreviousSplit = false
        this._currentIndex = 0
        this.isfirstSentenceShow = true
        this.readFinishCallback = null
        this.firstSentenceShowCallback = null
        this.ismute = localStorage.getItem('silent') === 'true'
        this.scrollFunction = scrollFunction
    }

    /**
     * @returns {AudioContext}
     */
    get audioContext() {
        if (!this._audioContext) {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this._audioContext;
    }

    ttsCheckStatus() {
        this.ismute = localStorage.getItem('silent') === 'true'
    }

    /**
     * 
     * @param {function} callback 
     */
    bindShowCallback(callback) {
        this.firstSentenceShowCallback = callback
    }

    setFirstSentenceShow() {
        if (this.isfirstSentenceShow) {
            this.isfirstSentenceShow = false
            if (this.firstSentenceShowCallback != null) {
                this.firstSentenceShowCallback()
            }
        }
    }

    /**
     * @param {Audiodata} audiodata
     */
    ttsPlay(audiodata) {
        /**
         * @param {string} base64 
         * @returns {ArrayBuffer}
         */
        function base64ToArrayBuffer(base64) {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }
        /**
         * @param {string} base64AudioData 
         * @param {AudioContext} audioContext 
         * @param {function} endedCallback 
         */
        function playBase64Audio(base64AudioData, audioContext, endedCallback) {
            const audioBuffer = base64ToArrayBuffer(base64AudioData);
            audioContext.decodeAudioData(audioBuffer, (buffer) => {
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.onended = endedCallback;
                console.log(source)
                source.start();
            }, (error) => {
                console.warn(base64AudioData)
                console.error('解码音频数据时出错:', error);
            });
        }
        if (audiodata.base64str == null) {
            return
        }
        let [index1, index2] = this.showSentence(audiodata)
        if (audiodata.issplit) {
            return
        }
        playBase64Audio(audiodata.base64str, this.audioContext, () => {
            this.refsentence[index1][index2].status = 2
            this.ttsNext()
        });
    }
    /** 
     * @param {Audiodata} audiodata 
     * @returns {[number, number]}
     */
    showSentence(audiodata) {
        if (audiodata.issplit) {
            this._currentIndex += 1;
            this.refsentence.push([])
            console.log("audiodata.issplit")
        }
        this.setFirstSentenceShow()
        this.refsentence[this._currentIndex].push({
            text: audiodata.text,
            status: this.ismute ? ref(2) : ref(1)
        })
        if (this.scrollFunction) {
            this.scrollFunction()
        }
        console.log(this._currentIndex, this.refsentence[this._currentIndex].length - 1)
        return [this._currentIndex, this.refsentence[this._currentIndex].length - 1]
    }

    /**
     * 
     * @param {Audiodata} audiodata 
     * @returns 
     */
    ttsRequest(audiodata) {
        if (audiodata.text == "\n") {
            console.warn("?")
            return
        }
        axios.post("http://localhost:1114/tts", { text: audiodata.text }).then((response) => {
            audiodata.base64str = response.data.audio
            console.log(this)
            if (!this.isTTSPlaying) {
                this.isTTSPlaying = true
                console.log(JSON.parse(JSON.stringify(this.pendingTTSList[0])))
                if (this.pendingTTSList.length > 0 && this.pendingTTSList[0].base64str != null) {
                    this.ttsPlay(this.pendingTTSList.shift())
                } else {
                    this.isTTSPlaying = false
                }
            }
        }).catch((error) => {
            console.error("TTS请求失败", error)
            this.isTTSPlaying = false
        })
    }

    ttsNext() {
        if (this.pendingTTSList.length > 0 && this.pendingTTSList[0].base64str != null) {
            let ttsnode = this.pendingTTSList.shift()
            if (ttsnode.isend) {
                if (this.readFinishCallback != null) {
                    this.readFinishCallback()
                    this.scrollFunction()
                }
                console.log("readFinishCallback")
            }
            this.ttsPlay(ttsnode)
        } else {
            this.isTTSPlaying = false
        }
    }

    ttsClear() {
        //this.refsentence.value = [[]]
        this._currentIndex = 0
        this.pendingTTSList = []
        this.isfirstSentenceShow = true
        this.ismute = localStorage.getItem('silent') == 'true'
        this.isPreviousSplit = false
    }
    /**
     * @param {boolean} status 
     */
    ttsSetStatus(status) {
        this.ismute = status
        localStorage.setItem('silent', status.toString())
    }
    /**
     * 
     * @returns {boolean}
     */
    ttsEndMark() {
        if (this.pendingTTSList.length > 0) {
            this.pendingTTSList[this.pendingTTSList.length - 1].isend = true
            return false
        }
        else {
            if (this.readFinishCallback) {
                this.readFinishCallback()
                this.scrollFunction()
            }
            return true
        }
    }

    setSplitMark() {
        if (this.pendingTTSList.length > 0)
            this.pendingTTSList[this.pendingTTSList.length - 1].issplit = true
        else {
            this._currentIndex += 1;
            this.refsentence.push([])
            console.log("audiodata.forcesplit")
        }
    }

    /**
     * @param {import('vue').Ref} answerref 
     * @param {string} sentence 
     * @param {boolean} issplit
     */
    addSentence(answerref, sentence, issplit = false) {
        if (issplit && this.isPreviousSplit) {
            return
        }
        if (issplit) {
            this.isPreviousSplit = true
        } else {
            this.isPreviousSplit = false
        }
        this.pendingTTSList.push({
            isend: false,
            text: sentence,
            base64str: null,
            issplit: issplit,
            index: this.pendingTTSList.length
        })
        this.refsentence = answerref
        if (this.ismute) {
            this.muteNext()
        } else {
            this.ttsRequest(this.pendingTTSList[this.pendingTTSList.length - 1])
        }
    }

    muteDisplay() {
        if (!this.isMuteDisplaying) {
            this.isMuteDisplaying = true
            this.muteNext()
        }
    }

    muteNext() {
        if (this.pendingTTSList.length > 0) {
            this.showSentence(this.pendingTTSList.shift())
            setTimeout(() => {
                this.muteNext()
            }, MUTE_DELAY)
        } else {
            this.isMuteDisplaying = false
        }
    }
}