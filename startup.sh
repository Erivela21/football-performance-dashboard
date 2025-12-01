#!/bin/bash
python -m gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
