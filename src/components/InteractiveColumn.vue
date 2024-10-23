<script setup>
import { ElButton, ElIcon, ElInput, ElNotification } from 'element-plus';
import { Ollama } from 'ollama/src/browser';
import ModelColumn from './ModelColumn.vue';
import { ref } from 'vue';
import LyricfulResponse from './LyricfulResponse.vue';
import { ContentLoader } from 'vue-content-loader';
import { CircleCheckFilled, CloseBold, Loading, Select } from '@element-plus/icons-vue';
import InteropPortal from '@/interop';


let nowtime = new Date().getHours()
var text = ""
if (0 <= nowtime && nowtime < 4)
    var text = "深夜啦😉"
else if (4 <= nowtime && nowtime <= 11)
    var text = "早上好😉"
else if (12 <= nowtime && nowtime <= 17)
    var text = "下午好😉"
else if (18 <= nowtime && nowtime <= 24)
    var text = "晚上好😉"
const iswelcomecn = Math.round(Math.random()) == 1
const finalText = iswelcomecn ? text : "Hello!😙"

const typingText = ref("")
var index = 0
function typingNext() {
    if (index != finalText.length) {
        let char = finalText[index]
        if (char == "\uD83D") {
            index += 1
            char += finalText[index]
        }
        typingText.value += char
        index += 1
        setTimeout(typingNext, 200)
    }
}
setTimeout(typingNext, 1000)
</script>

<template>
    <div class="main_container">
        <ModelColumn ref="model" />
        <div :class="iswelcome ? 'app_container' : 'app_container app_container_justified'">
            <div class="result_container">
                <ContentLoader viewBox="0 0 250 60" v-if="isloading">
                    <rect x="0" y="0" rx="3" ry="3" width="170" height="10" />
                    <rect x="0" y="20" rx="3" ry="3" width="220" height="10" />
                    <rect x="0" y="40" rx="3" ry="3" width="250" height="10" />
                </ContentLoader>
                <LyricfulResponse ref="lyricful" :isloading="isloading" />
            </div>
            <!-- <div class="result_tips" v-if="isReady">
                <Transition name="fade">
                    <div class="result_pending" v-if="showPendingTips">
                        请稍等，这比我们想象中的慢。
                    </div>
                </Transition>
            </div> -->
            <div :class="iswelcomecn ? 'welcome_tips_cn' : 'welcome_tips'" v-if="iswelcome">
                {{ typingText }}
            </div>
            <div class="input_container">
                <ElInput :autosize="{ minRows: 1, maxRows: 6 }" v-model="inputText" type="textarea"
                    placeholder="向我提出一个问题吧" class="input_el" ref="elInput" />
                <div :class="!isRunning ? 'container_btn_send' : 'container_btn_send btn_send_gradient'">
                    <ElButton v-wave :type="'primary'" @click="onsend" circle>
                        <ElIcon size="16">
                            <Select v-if="!isRunning" />
                            <Loading class="is-loading" v-else />
                        </ElIcon>
                    </ElButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
const iswelcome = ref(true)
const isRunning = ref(false)
const isReady = ref(false)
const inputText = ref('')
const splitPatterns = ['。', "！", "？"]//['，', '。', '：', '；', '！', '？',
//',', '.', ':', ';', '!', '?']
const showPendingTips = ref(false)
var responseStatus = undefined
var onmou = false
var isloading = ref(false)
const interopPortal=new InteropPortal("http://localhost:8080")

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })
export default {
    components: {
        LyricfulResponse
    },
    data() {
        return {
            renderFinish: () => {
                isloading = false
            },
            onsend: async () => {
                if (inputText.value == '') {
                    ElNotification({
                        type: 'warning',
                        title: "内容不能为空！",
                        message: "内容不能为空！",
                    })
                    return
                }
                if (isRunning.value) {
                    this.$refs.lyricful.ttsStop()
                    isRunning.value = false
                    return
                }
                iswelcome.value = false
                isloading.value = true
                isRunning.value = true
                responseStatus = true
                this.$refs.lyricful.clearAllLyrics()
                speechSynthesis.cancel()
                setTimeout(function () {
                    if (responseStatus) {
                        showPendingTips.value = true
                    }
                }, 1000)
                const response = await ollama.generate({
                    model: 'llama3.1',
                    prompt: await interopPortal.combinePrompt(inputText.value),
                    stream: true
                })
                var lastSentence = ''
                for await (const part of response) {
                    for (let index = 0; index < part.response.length; index++) {
                        const char = part.response[index];
                        lastSentence += char
                        if (!isRunning.value) {
                            this.$refs.lyricful.addSentence(lastSentence, false)
                            break
                        }
                        if ((char == '.' || char == ':') && /[0-9]/.test(lastSentence[lastSentence.length - 2])) {
                            continue
                        }
                        if (char == '.' && lastSentence[lastSentence.length - 2] == ".")
                            continue
                        if (splitPatterns.indexOf(char) != -1) {
                            this.$refs.lyricful.addSentence(lastSentence)
                            lastSentence = ''
                        }
                    }
                    if (!isRunning.value) {
                        break
                    }
                }
                isloading.value = false
                setTimeout(function () {
                    responseStatus = false
                    showPendingTips.value = false
                }, 100)
                isRunning.value = false
            },
            lyricfulResponse: undefined
        }
    },
    mounted() {

    }
}
</script>
<style scoped>
@keyframes textarea_focusIn {
    0% {
        background-position: 0% 50%;
        border-width: 3px;
    }

    100% {
        background-position: 90% 50%;
        border-width: 5px;
    }
}

@keyframes textarea_focusOut {
    0% {
        background-position: 90% 50%;
        border-width: 5px;
    }

    100% {
        background-position: 0% 50%;
        border-width: 3px;
    }
}

@keyframes animation_loading {
    0% {
        background-position: 0% 0%;
    }

    25% {
        background-position: 33% 66%;
    }

    50% {
        background-position: 100% 100%;
    }

    75% {
        background-position: 66% 33%;
    }

    100% {
        background-position: 0% 0%;
    }
}

:deep(.el-button) {
    width: 40px;
    height: 40px;
    border-color: transparent;
}

:deep(.btn_send_gradient .el-button) {
    animation: animation_loading 5s;
    animation-iteration-count: infinite;
    animation-direction: normal;
    animation-fill-mode: forwards;
    background-size: 300%;
    background-position: 0% 0%;
    background-image: linear-gradient(to right, #eea2a2 0%, #bbc1bf 19%, #57c6e1 42%, #b49fda 79%, #7ac5d8 100%);

}

:deep(.el-textarea__inner) {
    resize: none;
    font-size: 16px;
    padding: 9px 15px;
    animation-fill-mode: forwards;
    animation: textarea_focusOut .3s cubic-bezier(0.85, 0.01, 0.58, 1);
    border: 3px solid transparent;
    border-radius: 24px;
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
    background-size: 200%;
    background-position: 0% 50%;
    background-image: linear-gradient(to right, #fff, #fff), linear-gradient(135deg, #c3cfe2 0%, #e0e1e2 40%, #e0c3fc 55%, #8ec5fc 100%);
}

:deep(.is-focus) {
    animation: textarea_focusIn .3s cubic-bezier(0.85, 0.01, 0.58, 1);
    animation-fill-mode: forwards;
}

:deep(.input_el_focusOut) {
    animation-fill-mode: forwards;
    animation: textarea_focusOut .5s ease-in-out;
}
</style>
<style>
.welcome_tips_cn {
    white-space: nowrap;
    font-size: 30px;
    align-self: center;
    margin-right: 30px;
    padding-bottom: 18px;
    font-family: "SourceHanSansBold";
}

.welcome_tips {
    white-space: nowrap;
    font-family: "Gilroy";
    font-size: 30px;
    align-self: center;
    margin-right: 40px;
    padding-bottom: 18px;
}

.is-loading {
    animation: rotating 2s linear infinite;
}

.container_btn_send {
    margin-left: 12px;
    justify-self: end;
}

.input_container {
    display: flex;
    align-items: center;
}

.app_container {
    width: 100%;
    display: flex;
    padding: 10px;
    transition: justify-content 0.3s ease;
    flex-direction: column;
    justify-content: center;
}

.app_container_justified {
    justify-content: end;
}

.main_container {
    display: flex;
    width: 100%;
    transition: justify-content 0.3s ease;
}

code {
    font-style: oblique 2deg;
    font-size: large;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.result_pending {
    color: gray;
    font-size: small;
    padding-block: 3px;
}

.result_tips {
    align-items: center;
    display: flex;
    color: gray;
    font-weight: 400;
    font-size: small;
}

.btn_send {
    margin-top: 1px;
    margin-left: 12px;
    justify-self: end;
    transition: background-color .2s ease-in-out;
}
</style>