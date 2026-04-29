fn read_word(line: &str, idx: usize) -> Option<&str> {
    line.split_whitespace().nth(idx)
}

fn count_words(line: &str) -> usize {
    line.split_whitespace().count()
}

fn first_word(line: &str) -> Option<&str> {
    read_word(line, 0)
}
