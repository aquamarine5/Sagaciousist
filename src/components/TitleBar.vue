<script setup>
import { ref } from "vue";
import "../assets/fonts/font.css"
import LineMdVolumeRemoveTwotone from '~icons/line-md/volume-remove-twotone?width=33px&height=33px';
import LineMdVolumeHighTwotone from '~icons/line-md/volume-high-twotone?width=33px&height=33px';

const isSilent=ref(false)
if(localStorage.getItem('silent')==null){
    localStorage.setItem('silent',false)
}else{
    isSilent.value=localStorage.getItem('silent')=='true'
}
function changeSilent(){
    isSilent.value=!isSilent.value
    localStorage.setItem('silent',isSilent.value)
}
</script>

<template>
    <div class="topbar_container">
        <div class="topbar_title">
            Sagaciousist
        </div>
        <div class="silent_button" @click="changeSilent">
            <LineMdVolumeRemoveTwotone v-if="isSilent"/>    
            <LineMdVolumeHighTwotone v-else/>
        </div>
    </div>
</template>

<style scoped>
.topbar_container{
    background-image: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
    border-radius: 0px 0px 16px 16px;
    height: 70px;
    display: flex;
    align-items: center;
    padding: 0px 25px;
    
}
.topbar_title{
    font-family: 'Gilroy';
    font-weight: 600;
    font-size: 32px;
    color: white;
    cursor: pointer;
}
.silent_button{
    margin-top: 2px;
    cursor: pointer;
    margin-left: auto;
}
</style>