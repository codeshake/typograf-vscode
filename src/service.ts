import http from "node:http"

const XML_REPLACERS = [
    ["&", "&amp;"],
    ["<", "&lt;"],
    [">", "&gt;"],
] as const

const replaceXmlSymbolsInString = (value: string, encode: boolean) => {
    let result = value

    for (const replacer of XML_REPLACERS) {
        result = result.replaceAll(replacer[encode ? 0 : 1], replacer[encode ? 1 : 0])
    }

    return result
}

type TypografProperties = {
    text: string
    entityType: number
    useBr: number
    useP: number
    maxNobr: number
    quotA: string
    quotB: string
}

const generateXmlBody = ({
    text,
    entityType,
    useBr,
    useP,
    maxNobr,
    quotA,
    quotB,
}: TypografProperties) => {
    return `<?xml version="1.0" encoding="UTF-8"?>` +
        `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
            `<soap:Body>` +
	            `<ProcessText xmlns="http://typograf.artlebedev.ru/webservices/">` +
	                `<text>${replaceXmlSymbolsInString(text, true)}</text>` +
                    `<entityType>${entityType}</entityType>` +
                    `<useBr>${useBr}</useBr>` +
                    `<useP>${useP}</useP>` +
                    `<maxNobr>${maxNobr}</maxNobr>` +
                    `<quotA>${quotA}</quotA>` +
                    `<quotB>${quotB}</quotB>` +
	            `</ProcessText>` +
            `</soap:Body>` +
        `</soap:Envelope>`
}

const resultRegularExpression = /<ProcessTextResult>(?<find>(.|\n)*?)<\/ProcessTextResult>/gm

const getResultFromXml = (value: string) => {
    const matches = value.matchAll(resultRegularExpression).toArray()

    for (const match of matches) {
        if (match.groups?.find) {
            return replaceXmlSymbolsInString(match.groups.find.trim(), false)
        }
    }

    throw new Error("No result found")
}

export const Typograf = (properties: TypografProperties) => new Promise<string>((resolve, reject) => {
    const body = generateXmlBody(properties)

    const request = http.request("http://typograf.artlebedev.ru/webservices/typograf.asmx", {
        method: "POST",
        headers: {
            "Content-Type": "text/xml",
            "Content-Length": Buffer.from(body).byteLength,
            SOAPAction: "http://typograf.artlebedev.ru/webservices/ProcessText",
        },
    }, response => {
        let data = ""

        response.on("data", chunk => {
            data += chunk.toString()
        })

        response.on("error", error => {
            reject(error)
        })

        response.on("end", () => {
            try {
                resolve(getResultFromXml(data))
            } catch (error) {
                reject(error)
            }
        })
    })

    request.on("error", error => {
        reject(error)
    })

    request.write(body)
    request.end()
})
