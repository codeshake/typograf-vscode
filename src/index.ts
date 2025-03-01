import * as vscode from "vscode"
import { Typograf } from "./service"

const typografRunner = async () => {
    const typografConfiguration = vscode.workspace.getConfiguration("typograf")
    const editor = vscode.window.activeTextEditor

    const {
        entityType,
        useBr,
        useP,
        maxNobr,
        quotA,
        quotB,
    } = typografConfiguration

    if (editor) {
        const selection = editor.selection
        const text = editor.document.getText(selection)

        if (text.length === 0) {
            vscode.window.showWarningMessage("Typograf", {
                modal: true,
                detail: "Please highlight the text"
            })

            return
        }

        try {
            const transformedText = await Typograf({
                text,
                entityType,
                useBr,
                useP,
                maxNobr,
                quotA,
                quotB,
            })

            editor.edit(editBuilder => {
                editBuilder.replace(selection, transformedText)
            })
        } catch (error) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`Typograf error: ${error.message}`)
            } else {
                console.error(error)
                vscode.window.showErrorMessage("Typograf unknown error, details in console")
            }
        }
    }
}

const command = vscode.commands.registerCommand('extension.typograf', typografRunner)

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(command)
}

export function deactivate() {}
