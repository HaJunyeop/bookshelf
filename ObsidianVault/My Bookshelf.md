# My Bookshelf

Use the web view for ratings, hidden books, search, and the relationship map.

## Library

```dataview
TABLE author, publisher, year, genre, rating
FROM "Books"
WHERE hidden = false
SORT title ASC
```

## Hidden books

```dataview
TABLE author, genre, rating
FROM "Books"
WHERE hidden = true
SORT title ASC
```

## Needs review

```dataview
TABLE author, source_photo
FROM "Books"
WHERE status = "Review" OR status = "寃???꾩슂"
```
