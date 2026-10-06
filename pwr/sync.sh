#!/bin/sh
# little script to synchronize dev and main files

pwrpath=$(realpath -q "$0/..")
devpath="$pwrpath/dev"

IFS=$'\n' read -r -d '' -a files < "$pwrpath/tracked.txt"

for file in "${files[@]}"
do
    if [[ "${1:--d}" != "-r" ]]
    then
        printf "%s --> %s\n" "$devpath/$file" "$pwrpath/"
    else
        cp "$devpath/$file" "$pwrpath/"
    fi
done
