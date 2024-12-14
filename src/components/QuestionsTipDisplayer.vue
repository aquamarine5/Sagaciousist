<!--
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
-->
<template>
    <div class="tips_container" v-if="false">
        <div class="tips_title">💡不知道问什么？试试下面的问题吧👇</div>
        <div class="tips_forcontainer">
            <div v-for="(question, index) in selectedQuestions" :key="index" class="tips_item">
                <span class="tips_button" @click="askQuestion(question)">{{ question }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import { ElNotification } from 'element-plus';

export default {
    data() {
        return {
            questions: [],
            selectedQuestions: []
        };
    },
    created() {
        this.loadQuestions();
    },
    methods: {
        loadQuestions() {
            axios.get("QuestionsTip.csv")
                .then(response => {
                    this.questions = response.data.split('\n').map(row => row.trim()).filter(row => row);
                    this.selectRandomQuestions();
                })
                .catch(error => {
                    ElNotification({
                        title: "问题提示加载失败",
                        type: "warning",
                        message: error
                    })
                });
        },
        selectRandomQuestions() {
            const shuffled = this.questions.sort(() => 0.5 - Math.random());
            this.selectedQuestions = shuffled.slice(0, 3);
        },
        async askQuestion(question) {
            this.$emit('askQuestion', question);
        }
    }
};
</script>

<style scoped>
.tips_container {
    display: block;
    margin-right: 40px;
}

.tips_title {
    text-align: center;
    font-family: "SourceHanSansBold";
    padding-block: 8px;
}

.tips_item {
    border-radius: 999px;
    padding: 5px 10px;
    margin: 5px;
    font-size: smaller;
    display: flex;
    align-items: center;
    border-style: solid;
    width: fit-content;
    border-color: gray;
    border-width: 2px;
    cursor: pointer;
}

.tips_forcontainer {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}
</style>
