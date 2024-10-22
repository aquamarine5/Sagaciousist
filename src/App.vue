<script setup>

import InteractiveColumn from './components/InteractiveColumn.vue';
import Topbar from './components/Topbar.vue';

</script>

<template>
    <Topbar></Topbar>
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