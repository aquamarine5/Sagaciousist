<script setup>
import { ElButton, ElInput, ElNotification } from 'element-plus';
import { Ollama } from 'ollama/src/browser';
import ModelColumn from './ModelColumn.vue';
import { ref } from 'vue';
import LyricfulResponse from './LyricfulResponse.vue';
import { ContentLoader } from 'vue-content-loader';
import debounce from 'lodash.debounce';

var status = ref('idle')

</script>

<template>
    <div class="main_container">
        <ModelColumn ref="model" />
        <div class="app_container">
            <div style="margin-bottom: 6px;">
                输入文字：
            </div>
            <ElInput :rows="6" v-model="inputText" type="textarea" placeholder="输入文字..." />
            <div class="container_btn_send">
                <ElButton v-wave class="btn_send" :type="status == 'idle' ? 'primary' : 'danger'" 
                    @click="debounce(onsend,200)">
                    {{ status == 'idle' ? '发送' : '停止' }}
                </ElButton>
            </div>
            <div class="result_tips">
                AI 回复：
                <Transition name="fade">
                    <div class="result_pending" v-if="showPendingTips">
                        请稍等，这比我们想象中的慢。
                    </div>
                </Transition>
            </div>
            <div class="result_container">

                <LyricfulResponse ref="lyricful" :isloading="isloading" />
                <ContentLoader viewBox="0 0 250 110" v-if="isloading">
                    <rect x="0" y="0" rx="3" ry="3" width="250" height="10" />
                    <rect x="0" y="20" rx="3" ry="3" width="220" height="10" />
                    <rect x="0" y="40" rx="3" ry="3" width="170" height="10" />
                </ContentLoader>
            </div>
        </div>
    </div>
</template>

<script>
const inputText = ref('')
const splitPatterns = ['，', '。', '：', '；', '！', '？',
    ',', '.', ':', ';', '!', '?']
const showPendingTips = ref(false)
var responseStatus = undefined
var onmou = false
var isloading = ref(false)

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })
export default {
    components: {
        LyricfulResponse
    },
    mounted() {
        onmou = true
    },
    data() {
        return {
            renderFinish: () => {
                isloading = false
            },
            onsend: async () => {
                if(inputText.value==''){
                    ElNotification({
                        type:'warning',
                        title:"内容不能为空！",
                        message:"内容不能为空！"
                    })
                    return
                }
                if (status == 'running') {
                    this.$refs.lyricful.ttsStop()
                    status == 'idle'
                    return
                }
                isloading.value = true
                status = 'running'
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
                        if (status == 'idle') {
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
                }
                isloading.value = false
                setTimeout(function () {
                    responseStatus = false
                    showPendingTips.value = false
                }, 100)
                status = 'idle'
            },
            lyricfulResponse: undefined
        }
    },
    mounted() {

    }
}
</script>

<style>
.app_container {
    width: 100%;
    display: flex;
    flex-direction: column;
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
    margin-top: 6px;
    justify-self: end;
}
</style>