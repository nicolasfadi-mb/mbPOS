FROM php:8.2-cli

RUN docker-php-ext-install mysqli pdo pdo_mysql

WORKDIR /app
COPY . /app

ENV PORT=10000
EXPOSE 10000

CMD ["sh", "-lc", "php -S 0.0.0.0:${PORT:-10000} -t ."]
