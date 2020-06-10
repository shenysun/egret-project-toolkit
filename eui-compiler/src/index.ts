import * as fs from 'fs';
import { DeclarationEmitter, JavaScriptEmitter, JSONEmitter } from './emitter';
import { getFilePathRelativeProjectRoot, getThemes, initilize } from './eui-config';
import { AST_Skin } from './exml-ast';
import { ThemeFile } from './theme';
import { generateAST } from "./util/parser";
import { initTypings } from './util/typings';

export const parser = require('./util/parser') as typeof import("./util/parser")
export const emitter = {
    JavaScriptEmitter,
    JSONEmitter,
    DeclarationEmitter
}

export type EuiAstTransformer = (ast: AST_Skin) => AST_Skin


type EmitSolution = (theme: ThemeFile, transformers: EuiAstTransformer[]) => { filename: string, content: string }


export class EuiCompiler {

    private _transformers: EuiAstTransformer[] = [];

    constructor(root: string) {
        initilize(root)
        initTypings();
    }

    setCustomTransformers(transformers: EuiAstTransformer[]) {
        this._transformers = transformers;
    }

    emit(): { filename: string, content: string }[] {
        const solution: EmitSolution = this.compileTheme;
        const themes = getThemes();
        return themes.map((theme) => solution(theme, this._transformers));
    }

    getThemes() {
        return getThemes();
    }

    private compileTheme(theme: ThemeFile, transformers: EuiAstTransformer[]) {
        const themeData = theme.data;
        const exmlFiles = themeData.exmls;
        const emitter = new JavaScriptEmitter();
        emitter.emitHeader(themeData);
        for (let filename of exmlFiles) {
            const fullpath = getFilePathRelativeProjectRoot(filename)
            const content = fs.readFileSync(fullpath, 'utf-8');
            let skinNode = generateAST(content);
            for (let transformer of transformers) {
                skinNode = transformer(skinNode);
            }
            emitter.emitSkinNode(filename, skinNode);
        }
        const filename = theme.filePath.replace("thm.json", 'thm.js');
        const content = emitter.getResult();
        return { filename, content }
    }
}









