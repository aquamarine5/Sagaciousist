<script setup>
import LineMdTextBoxMultipleTwotone from '~icons/line-md/text-box-multiple-twotone?width=24px&height=24px';
import LineMdClipboardListTwotone from '~icons/line-md/clipboard-list-twotone?width=24px&height=24px';
</script>

<template>
    <div class="selector_container">
        <div @click="selectMode('book')" class="selector_btn">
            <LineMdTextBoxMultipleTwotone/>
            书籍相关提问模式
        </div>
        <div @click="selectMode('history')" class="selector_btn">
            <LineMdClipboardListTwotone/>
            历史事件提问模式
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
.selector_btn{
    padding: 10px 20px;
    margin: 5px;
    cursor: pointer;
    border-radius: 5px;
    border-style: solid;
    border-color: gray;
    background-color: #f0f0f0;
}
.selector_container {
    display: flex;
    justify-content: space-between;
}

button {
    padding: 10px 20px;
    margin: 5px;
    cursor: pointer;
}
</style>