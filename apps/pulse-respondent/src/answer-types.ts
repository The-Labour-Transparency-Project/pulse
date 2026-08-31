import type {Component} from "vue";
import TextAnswer from "./components/answers/TextAnswer.vue";
import PrimaryChoiceAnswer from "./components/answers/PrimaryChoiceAnswer.vue";
import MultiSelectAnswer from "./components/answers/MultiSelectAnswer.vue";
import MatrixAnswer from "./components/answers/MatrixAnswer.vue";
import IntegerScaleAnswer from "./components/answers/IntegerScaleAnswer.vue";

export interface AnswerTypeDefinition {
    component: Component;
}

export const answerTypeRegistry: Record<string, AnswerTypeDefinition> = {
    content: {component: TextAnswer},
    longText: {component: TextAnswer},
    singleSelect: {component: PrimaryChoiceAnswer},
    multiSelect: {component: MultiSelectAnswer},
    matrixSingleSelect: {component: MatrixAnswer},
    integerScale: {component: IntegerScaleAnswer},
};
