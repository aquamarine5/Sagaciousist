<!--
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
-->
<script setup>
import { ref } from "vue";
import "../assets/fonts/font.css"
import MdiTts from '~icons/mdi/tts?&width=30px&height=30px';
import MdiTtsOff from '~icons/mdi/tts-off?&width=30px&height=30px';
import LucideBotMessageSquare from '~icons/lucide/bot-message-square?width=30px&height=30px';
import pkginfo from '../../package.json'
import baseinfo from "@/baseinfo";

const isSilent = ref(false)
if (localStorage.getItem('silent') == null) {
    localStorage.setItem('silent', false)
} else {
    isSilent.value = localStorage.getItem('silent') === 'true'
}
function changeSilent() {
    isSilent.value = !isSilent.value
    localStorage.setItem('silent', isSilent.value.toString())
}
</script>

<template>
    <div class="topbar_container">
        <div class="topbar_title">
            <div class="topbar_center">
                <LucideBotMessageSquare class="topbar_logo" />
                {{ baseinfo.baseLibrary + "人工智能" }}
            </div>
            <div class="topbar_version">
                v{{ pkginfo.version }}
            </div>
        </div>
        <div class="silent_button" @click="changeSilent">
            <MdiTtsOff v-if="isSilent" />
            <MdiTts v-else />
        </div>
    </div>
</template>

<style scoped>
.topbar_logo {
    margin-right: 3px;
}

.topbar_version {
    font-size: medium;
    font-family: "Gilroy", sans-serif;
    padding-top: 3px;
    padding-left: 2px;
}

.topbar_container {
    background-image: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
    border-radius: 0px 0px 16px 16px;
    height: 70px;
    display: flex;
    align-items: center;
    padding: 0px 25px;

}

.topbar_center {
    display: flex;
    align-items: center;
}

.topbar_title {
    display: flex;
    font-family: 'SourceHanSansBold';
    font-weight: 600;
    font-size: 24px;
    color: white;
    cursor: pointer;
}

.silent_button {
    margin-top: 2px;
    cursor: pointer;
    margin-left: auto;
}
</style>