<!--
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
-->
<script setup>
import InteractiveColumn from './components/InteractiveColumn.vue';
import TitleBar from './components/TitleBar.vue';
</script>

<template>
    <TitleBar />
    <div style="margin: 24px">
        <InteractiveColumn />
    </div>
</template>
<style>
p {
    margin-block: 4px;
}

div,
span {
    font-family: "SourceHanSansRegular";
}
</style>