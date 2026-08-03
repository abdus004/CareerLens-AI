PASS_THRESHOLD = 80


def score_assessment(question_ids: list, bank_by_id: dict, answers_by_number: dict) -> dict:
    """
    Pure, deterministic scoring - no AI involved anywhere in this
    function. `question_ids` is the assessment's ordered array (the
    source of truth for which questions belong to this attempt and in
    what order). `bank_by_id` is {question_id: assessment_question_bank
    row} (must contain correct_answer + topic). `answers_by_number` is
    {question_number: assessment_answers row}.

    A question counts as skipped if there is no saved answer row for
    it, its selected_option is empty/None, or it was explicitly marked
    skipped - covering both "the student clicked Skip" and "the timer
    expired before they ever reached this question".

    Returns a dict ready to be stored in assessment_results and to
    drive both the Result page and the (separate) Gemini feedback call.
    """
    total_questions = len(question_ids)

    correct_count = 0
    incorrect_count = 0
    skipped_count = 0

    # topic -> {"correct": int, "total": int}
    topic_stats = {}
    incorrect_topics = []

    per_question = []

    for index, question_id in enumerate(question_ids, start=1):
        bank_row = bank_by_id.get(question_id)
        if bank_row is None:
            # The question_bank row was deleted after this attempt was
            # created - can't score it either way, so treat it as
            # skipped rather than crashing the whole submission.
            skipped_count += 1
            continue

        topic = bank_row.get("topic") or "General"
        topic_stats.setdefault(topic, {"correct": 0, "total": 0})
        topic_stats[topic]["total"] += 1

        answer_row = answers_by_number.get(index)
        selected_option = (answer_row or {}).get("selected_option")
        is_skipped = (answer_row is None) or (answer_row or {}).get("skipped") or not selected_option

        if is_skipped:
            skipped_count += 1
            outcome = "skipped"
        elif selected_option == bank_row["correct_answer"]:
            correct_count += 1
            topic_stats[topic]["correct"] += 1
            outcome = "correct"
        else:
            incorrect_count += 1
            incorrect_topics.append(topic)
            outcome = "incorrect"

        per_question.append(
            {
                "question_number": index,
                "question_id": question_id,
                "topic": topic,
                "selected_option": selected_option,
                "correct_answer": bank_row["correct_answer"],
                "outcome": outcome,
            }
        )

    percentage = round((correct_count / total_questions) * 100, 2) if total_questions else 0.0
    passed = percentage >= PASS_THRESHOLD

    topic_performance = [
        {
            "topic": topic,
            "correct": stats["correct"],
            "total": stats["total"],
            "percentage": round((stats["correct"] / stats["total"]) * 100, 2) if stats["total"] else 0.0,
        }
        for topic, stats in sorted(topic_stats.items())
    ]

    return {
        "total_questions": total_questions,
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "skipped_count": skipped_count,
        "percentage": percentage,
        "passed": passed,
        "topic_performance": topic_performance,
        "incorrect_topics": sorted(set(incorrect_topics)),
        "per_question": per_question,
    }
