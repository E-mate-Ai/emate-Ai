'use client';

import React, { useEffect, useState } from 'react';
import type { MCQQuiz, MCQSubmission } from '@/lib/agents/types';

interface InlineMCQQuizProps {
  quiz: MCQQuiz;
  theme: 'light' | 'dark';
  initialSubmission?: MCQSubmission;
  onSubmit: (submission: MCQSubmission) => void;
}

export default function InlineMCQQuiz({ quiz, theme, initialSubmission, onSubmit }: InlineMCQQuizProps) {
  const isDark = theme === 'dark';
  const [answers, setAnswers] = useState<Record<string, number>>(initialSubmission?.answers || {});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>(
    initialSubmission ? Object.fromEntries(quiz.questions.map((question) => [question.id, true])) : {}
  );
  const [completionSent, setCompletionSent] = useState(Boolean(initialSubmission));

  useEffect(() => {
    setAnswers(initialSubmission?.answers || {});
    setCheckedAnswers(
      initialSubmission ? Object.fromEntries(quiz.questions.map((question) => [question.id, true])) : {}
    );
    setCompletionSent(Boolean(initialSubmission));
  }, [quiz.id, initialSubmission]);

  const checkAnswer = (questionId: string) => {
    const selectedAnswer = answers[questionId];
    if (selectedAnswer === undefined || checkedAnswers[questionId]) return;

    const nextChecked = { ...checkedAnswers, [questionId]: true };
    setCheckedAnswers(nextChecked);

    const allQuestionsChecked = quiz.questions.every((question) => nextChecked[question.id]);
    if (allQuestionsChecked && !completionSent) {
      const submission: MCQSubmission = {
        quizId: quiz.id,
        answers,
        timePerQuestion: {},
        completedAt: new Date().toISOString(),
      };
      setCompletionSent(true);
      onSubmit(submission);
    }
  };

  return (
    <section
      className={`mx-auto my-2 w-full max-w-2xl ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}
      aria-label={`${quiz.subject} practice quiz`}
    >
      <h2 className="mb-3 text-left text-lg font-semibold tracking-tight sm:mb-4 sm:text-xl">
        Test yourself 🧠
      </h2>

      <div className="space-y-4">
        {quiz.questions.map((question, questionIndex) => {
          const selectedAnswer = answers[question.id];
          const isChecked = Boolean(checkedAnswers[question.id]);
          const correct = selectedAnswer === question.correctAnswer;

          return (
            <article
              key={question.id}
              className={`w-full rounded-2xl border px-4 py-4 sm:px-6 sm:py-5 shadow-xs ${
                isDark
                  ? 'border-white/10 bg-[#111113]'
                  : 'border-zinc-200 bg-white'
              }`}
            >
              <h3 className={`mb-3.5 text-left text-sm sm:text-base font-semibold leading-relaxed ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Q{questionIndex + 1}. {question.question}
              </h3>

              <div className="space-y-1.5" role="radiogroup" aria-label={`Answer choices for question ${questionIndex + 1}`}>
                {question.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswer === optionIndex;
                  const isCorrectAnswer = question.correctAnswer === optionIndex;
                  const radioBorder = isDark ? 'border-zinc-600' : 'border-zinc-300';
                  const selectionBorder = 'border-[#1f51ff]';

                  return (
                    <button
                      key={`${question.id}-${optionIndex}`}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isChecked}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                      className={`flex min-h-[38px] w-full items-start gap-2.5 rounded-lg p-2 text-left text-xs sm:text-sm font-normal leading-relaxed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f51ff] disabled:cursor-default ${
                        isSelected
                          ? isDark
                            ? 'bg-zinc-800/60 text-zinc-100'
                            : 'bg-blue-50/70 text-zinc-900'
                          : isDark
                          ? 'hover:bg-zinc-800/40 text-zinc-300 disabled:hover:bg-transparent'
                          : 'hover:bg-zinc-50 text-zinc-700 disabled:hover:bg-transparent'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:h-[18px] sm:w-[18px] ${isSelected ? selectionBorder : radioBorder}`} aria-hidden="true">
                        {isSelected && <span className="h-2 w-2 rounded-full bg-[#1f51ff]" />}
                      </span>
                      <span className={isChecked && isCorrectAnswer ? (isDark ? 'font-medium text-emerald-400' : 'font-medium text-emerald-600') : undefined}>
                        <span className="font-medium mr-1">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => checkAnswer(question.id)}
                disabled={selectedAnswer === undefined || isChecked}
                className={`mt-4 min-h-[38px] sm:min-h-[42px] w-full rounded-xl border-0 px-4 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f51ff] disabled:cursor-not-allowed ${
                  selectedAnswer === undefined || isChecked
                    ? (isDark ? 'bg-zinc-800/60 text-zinc-500' : 'bg-zinc-100 text-zinc-400')
                    : 'bg-[#1f51ff] text-white hover:bg-[#1745e8]'
                }`}
              >
                Check Answer
              </button>

              {isChecked && (
                <p className={`mt-3 text-xs leading-relaxed sm:text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`} aria-live="polite">
                  <span className={`font-semibold ${correct ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-rose-400' : 'text-rose-700')}`}>
                    {correct ? 'Correct. ' : 'Incorrect. '}
                  </span>
                  {question.explanation}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
