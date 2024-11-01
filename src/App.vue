<script setup>

import InteractiveColumn from './components/InteractiveColumn.vue';
import TopBar from './components/TopBar.vue';

</script>

<template>
    <TopBar></TopBar>
    <div style="margin: 24px">
        <InteractiveColumn/>
    </div>
</template>
<style>
p{
    margin-block: 4px;
}
div, span{
    font-family: "SourceHanSansRegular";
}
</style>