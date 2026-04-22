interface StoragedMessageIndexes {
    userindex: number;
    answerindex: number;
}

interface QAStructure {
    question: string;
    answer: SentenceResponse[][];
    isloading: boolean;
    isfinish: boolean;
    messageIndexes: StoragedMessageIndexes;
    btnclicked: boolean[];
}

interface SentenceResponse {
    text: string;
    status: import("vue").Ref<number>;
    thinkingValue: number;
}