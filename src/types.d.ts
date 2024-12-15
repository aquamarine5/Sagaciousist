interface StoragedMessageIndexes{
    userindex: number;
    answerindex: number;
}

interface QAStructure{
    question: string;
    answer: import("vue").Ref;
    isloading: boolean;
    isfinish: boolean;
    messageindex: StoragedMessageIndexes;
}