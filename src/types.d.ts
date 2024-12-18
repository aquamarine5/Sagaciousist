interface StoragedMessageIndexes{
    userindex: number;
    answerindex: number;
}

interface QAStructure{
    question: string;
    answer: import("vue").Ref<SentenceResponse[][]>;
    isloading: boolean;
    isfinish: boolean;
    messageindex: StoragedMessageIndexes;
    btnclicked: boolean[];
}

interface SentenceResponse{
    text: string;
    status: import("vue").Ref<string>;
}