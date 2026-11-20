FROM docker:29-cli
RUN apk add --no-cache bash curl git jq tar coreutils
COPY --chmod=755 deploy/updater/entrypoint.sh /updater.sh
VOLUME /state
ENTRYPOINT ["/updater.sh"]
