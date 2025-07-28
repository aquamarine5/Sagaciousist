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
    <div style="padding: 12px 18px;" class="background">
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

.background {

    background-image: linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url("./image.png");
    background-size: cover;
    background-repeat: no-repeat;
}
</style>