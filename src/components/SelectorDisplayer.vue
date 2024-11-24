<!--
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
-->
<script setup>
import LineMdTextBoxMultipleTwotone from '~icons/line-md/text-box-multiple-twotone?width=64px&height=64px';
import LineMdFileSearchTwotone from '~icons/line-md/file-search-twotone?width=64px&height=64px';
</script>

<template>
    <div class="selector">
        <div class="selector_title">
            让我们从选择一个问答模式开始吧🤓
        </div>
        <div class="selector_container">

            <div @click="selectMode('book')" class="selector_btn">
                <LineMdTextBoxMultipleTwotone class="selector_icon_two" />
                书籍相关<br />提问模式
            </div>
            <div @click="selectMode('history')" class="selector_btn">
                <LineMdFileSearchTwotone class="selector_icon" />
                历史事件<br />提问模式
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'SelectorDisplayer',
    methods: {
        selectMode(mode) {
            this.$emit('modeSelected', mode);
        }
    }
}
</script>

<style scoped>
@keyframes btn_focusIn {
    0% {
        background-position: 0% 0%;
    }

    100% {
        background-position: 100% 100%;
    }
}

@keyframes btn_focusOut {
    0% {
        background-position: 100% 100%;
    }

    100% {
        background-position: 0% 0%;
    }
}

.selector_title {
    text-align: center;
    margin-right: 20px;
    padding-bottom: 15px;
    display: flex;
    font-size: large;
    justify-content: center;
    align-items: center;
}

.selector_btn {
    padding: 10px 20px;
    margin: 5px;
    cursor: pointer;
    border-radius: 10px;
    border-style: solid;
    border-width: 7px;
    border-color: transparent;
    animation-fill-mode: forwards;
    animation: btn_focusOut 0.3s ease-in-out;
    display: flex;
    align-items: center;
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
    background-size: 300%;
    background-position: 0% 0%;
    background-image: linear-gradient(to right, #f0f0f0, #f0f0f0), linear-gradient(135deg, #76e4f4, #9e6fcd, #c777a9);
}

.selector_btn:hover {
    animation: btn_focusIn 0.3s ease-in-out;
    animation-fill-mode: forwards;
}

.selector_icon {
    padding-right: 8px;
}

.selector_icon_two {
    padding-right: 8px;
    margin-right: 5px;
}

.selector_container {
    display: flex;
    justify-content: space-evenly;
}

button {
    padding: 10px 20px;
    margin: 5px;
    cursor: pointer;
}
</style>