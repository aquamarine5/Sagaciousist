import axios from "axios";

export default class InteropPortal {
    constructor(url) {
        this.baseUrl = url
    }
    getPrompt(text) {
        return axios.get(this.baseUrl + "/search?query=" + text)
    }
    combinePrompt(text) {
        return new Promise((resolve, reject) => {
            if(import.meta.env.MODE != "single") {
                this.getPrompt(text).then(response => {
                    let esPrompt = ""
                    response.data[0].forEach(element => {
                        esPrompt += element.title + element.content + "\n"
                    });
                    const prePrompt = "除非提前指明，否则请使用中文回答。请不要使用Markdown的列表、*号来进行分条列点输出，这是前提，你不用对上述要求进行回复，只需要对这个句号之后的内容进行回复。"
                    const sagePrompt = "假设你是一位研究资质通鉴方面的专家，你需要为青年大学生解决有关在阅读资治通鉴的过程中遇到的问题和困惑。以下会为你告知一些关于问题的一些参考内容：" +
                        esPrompt + "。" +
                        "情况：大学生在阅读资质通鉴的过程中会产生一些疑问。" +
                        "行动：请你对这些问题进行回答并给出指导建议，在回答时给予具体实例。" +
                        "目标：让用户得到问题的准确答案，并从中获得对个人发展方面的建议以及对社会，人生等方面的思考。" +
                        "预期: 输出文本即可"
                    resolve(prePrompt + sagePrompt + text)
                })
            }
            else{
                resolve(text)
            }
        })
    }
}