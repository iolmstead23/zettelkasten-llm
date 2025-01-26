import os
import re
import nltk
import markdown
from pathlib import Path
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.tag import pos_tag

nltk.download('punkt')
nltk.download('wordnet')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')

stop_words = set(stopwords.words('english'))

file_path = "../Zettelkasten"
markdown_text = []
tagged_tokens = []
tokens = []
tokens_lemma = []
tokens_punct = []
unique_tokens = []
seen = set()

def flatten_extend(matrix):
    flat_list = []
    for row in matrix:
        flat_list.extend(row)
    return flat_list

def markdown_directory_to_keywords(path, unique):
    lemmatizer = WordNetLemmatizer()
    # Initializing punctuations string
    symbols = ['','.',":","'s","(",")","","[","]",None,"’",",","`","--","|",";","?","%","!"," ","*"]
    # Iterate through each file in the directory
    try:
        for filename in os.listdir(path):
            # Construct the full file path
            markdown_file = os.path.join(path, filename)
            # Check if it's a markdown file
            if Path(markdown_file).suffix == '.md':
                # Read the markdown file
                with open(markdown_file, 'r', encoding="utf8") as f:
                    # Convert the markdown to HTML
                    html = markdown.markdown(f.read())
                    # Remove all HTML tags
                    text = re.sub('<[^>]*>', '', html)
                    # Make sure keywords are lowercase and tagged
                    tagged_tokens.append(pos_tag(word_tokenize(text.lower())))
        # only save nouns removing punctuation and stop words
        tokens = [t for t, n in flatten_extend(tagged_tokens) if n=='NN' and t not in stop_words and t not in symbols]
        # lemming
        for token in tokens:
            tokens_lemma.append(lemmatizer.lemmatize(token))
        # remove duplicate words
        for token in tokens_lemma:
            if token not in seen:
                unique_tokens.append(token)
                seen.add(token)
    except OSError as e:
        print("Unable to load Zettelkasten files", e)
    else:
        if (unique):
            return len(unique_tokens)
        else:
            return [(t,tokens_lemma.count(t)) for t in unique_tokens]

if __name__ == "__main__":
    try:
        # Save Report with UTF-8 encoding
        with open(f"{file_path}/output/keyword report.txt", 'w', encoding='utf-8') as file:
            file.write(f"Unique Nouns: {markdown_directory_to_keywords(f'{file_path}/', True)}")
            file.write("\n\nFrequency Counts:\n\n")
            for w, f in sorted(markdown_directory_to_keywords(f"{file_path}/", False), key=lambda a: a[1], reverse=True):
                file.write(f"{w}: {f}\n")
    except OSError as e:
        print("Unable to Save Keywords", e)
    else:
        print("Keywords Extracted Successfully!")
        os.system('pause')
