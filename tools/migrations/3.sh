#!/bin/bash

# STEP 1
# migrates imports

if [[ $# -lt 1 ]]; then
cat <<- EOT
	Usage: $0 <db>

EOT
exit
fi

DB=$1

read -r -d '' COMMAND <<- EOC

db.imports.find({'baseData.file' : {\$type: 2}}).forEach(function(x){
	var fileName = x.baseData.file;
	x.baseData.file = {};
	x.baseData.file.fileId = fileName;
	x.baseData.file.fileName = fileName;
	x.baseData.file.size = 0;
	x.baseData.file.contentType = "text/csv";

	db.imports.update({_id : x._id}, x);

});

EOC

mongo $DB --quiet --eval "$COMMAND"
