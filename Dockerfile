FROM node:20-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

COPY docker/entrypoint.sh /usr/local/bin/extension-entrypoint
RUN chmod +x /usr/local/bin/extension-entrypoint

ENTRYPOINT ["extension-entrypoint"]
CMD ["pnpm", "build"]
