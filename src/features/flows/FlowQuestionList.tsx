import { useTranslation } from "react-i18next";
import { MarkdownViewer } from "@/features/reading/MarkdownViewer";
import type { ParsedInterviewQuestion } from "@/lib/contentParsing";

/** A question prompt and its reference answer, with empty answers kept explicit. */
export function FlowQuestionList({ questions }: { questions: ParsedInterviewQuestion[] }) {
  const { t } = useTranslation();

  return (
    <div className="flow-question-list">
      {questions.map((question) => (
        <section className="flow-question" key={question.id}>
          <MarkdownViewer
            body={[`### ${question.prompt}`, question.promptBody].filter(Boolean).join("\n\n")}
          />
          <h4 className="flow-question__answer-heading">{t("flows.answer")}</h4>
          {question.hasAnswer ? (
            <MarkdownViewer body={question.answer} />
          ) : (
            <p className="flow-question__empty-answer">{t("flows.answerNotAdded")}</p>
          )}
        </section>
      ))}
    </div>
  );
}
