<script setup>
import { ElButton, ElIcon, ElInput, ElNotification } from 'element-plus';
import { Ollama } from 'ollama/src/browser';
import ModelColumn from './ModelColumn.vue';
import { ref } from 'vue';
import LyricfulResponse from './LyricfulResponse.vue';
import { ContentLoader } from 'vue-content-loader';
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue';


</script>

<template>
    <div class="main_container">
        <ModelColumn ref="model" />
        <div class="app_container">
            <div class="result_container">
                <ContentLoader viewBox="0 0 250 60" v-if="isloading">
                    <rect x="0" y="0" rx="3" ry="3" width="170" height="10" />
                    <rect x="0" y="20" rx="3" ry="3" width="220" height="10" />
                    <rect x="0" y="40" rx="3" ry="3" width="250" height="10" />
                </ContentLoader>
                <LyricfulResponse ref="lyricful" :isloading="isloading" />
            </div>
            <div class="result_tips" v-if="isReady">
                <Transition name="fade">
                    <div class="result_pending" v-if="showPendingTips">
                        请稍等，这比我们想象中的慢。
                    </div>
                </Transition>
            </div>
            <div class="input_container">
                <ElInput :autosize="{ minRows: 1, maxRows: 6 }" v-model="inputText" type="textarea"
                    placeholder="向我提出一个问题吧" class="input_el" ref="elInput" />
                <div class="container_btn_send">
                    <ElButton v-wave class="btn_send" :type="isRunning ? 'danger' : 'primary'" @click="onsend" circle>
                        <ElIcon>
                            <CircleCloseFilled v-if="isRunning" />
                            <CircleCheckFilled v-else />
                        </ElIcon>
                    </ElButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

const isRunning = ref(false)
const isReady = ref(false)
const inputText = ref('')
const splitPatterns = ['。',"！","？"]//['，', '。', '：', '；', '！', '？',
    //',', '.', ':', ';', '!', '?']
const showPendingTips = ref(false)
var responseStatus = undefined
var onmou = false
var isloading = ref(false)

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })
export default {
    components: {
        LyricfulResponse
    },
    created() {
        return
        onmou = true
        ollama.generate({
            model: 'llama3.1',
            prompt: "除非提前指明，否则请使用中文回答。请不要使用Markdown的列表、*号来进行分条列点输出，这是前提，你不用对上述要求进行回复，只需要回答这个句号之后的内容。你好！",
        }).then(response => {
            let lastSentence = ''
            for (let index = 0; index < response.response.length; index++) {
                const element = response.response[index];
                lastSentence += element
                if (splitPatterns.indexOf(element) != -1) {
                    this.$refs.lyricful.addSentence(lastSentence)
                    lastSentence = ''
                }
            }
        })

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
                    prompt: "除非提前指明，否则请使用中文回答。请不要使用Markdown的列表、*号来进行分条列点输出，这是前提，你不用对上述要求进行回复，只需要回答这个句号之后的内容。" + inputText.value,
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
    }

    100% {
        background-position: 90% 50%;
    }
}

@keyframes textarea_focusOut {
    0% {
        background-position: 90% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}
:deep(.el-textarea__inner) {
    animation-fill-mode: forwards;
    animation: textarea_focusOut .3s cubic-bezier(0.85, 0.01, 0.58, 1);
    border: 4px solid transparent;
    border-radius: 16px;
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
.input_container {
    display: flex;
    justify-self: center;
}

.app_container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.main_container {
    display: flex;
    width: 100%;
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

.container_btn_send {
    display: grid;
}

.result_tips {
    align-items: center;
    display: flex;
    color: gray;
    font-weight: 400;
    font-size: small;
}

.btn_send {
    margin-left: 12px;
    justify-self: end;
    transition: background-color .2s ease-in-out;
}
</style>