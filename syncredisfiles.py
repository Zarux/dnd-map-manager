import redis
import re
import json
import os

js = open("server/config.js", "r").readlines()
REDIS_PW = None
REDIS_HOST = None
redis_host_regex = re.compile(r'^.*?redisHost.*?:.*?[\"\'](.*)[\"\'].*')
redis_pasw_regex = re.compile(r'^.*?redisPassword.*?:.*?[\"\'](.*)[\"\'].*')
for line in js:
	if REDIS_HOST is None:
	    matches_host = redis_host_regex.match(line)
	    if matches_host:
	        REDIS_HOST = matches_host.groups()[0]

	if REDIS_PW is None:
	    matches_pasw = redis_pasw_regex.match(line)
	    if matches_pasw:
	        REDIS_PW = matches_pasw.groups()[0]


r = redis.StrictRedis(host=REDIS_HOST, port=6379, db=0, password=REDIS_PW)
keys = r.keys()
key_full_r = re.compile(r'images:room:.*?:.*')
key_room_r = re.compile(r'images:room:[^\:]*?$')
safe_files = []
for key in keys:
	key_s = str(key)[2:-1]
	key_type = None
	if key_full_r.match(key_s):
		key_type = "full"
	elif key_room_r.match(key_s):
		key_type = "room"

	if key_type is None:
		continue
	elif key_type == "full":
		data = r.get(key)
		if os.path.isfile(data):
			safe_files.append(os.path.normpath(data))
		else:
			print("Deleted key: %s" % key)
			r.delete(key)
			
	elif key_type == "room":
		data = r.lrange(key, 0, -1)
		for idx, val in enumerate(data):
			img_data = json.loads(str(val)[2:-1])
			if not os.path.isfile(img_data["full"]) and not os.path.isfile(img_data["thumb"]):
				r.lrem(key, 0, val)
				print("Deleted value for %s" % img_data["filename"])
			elif not os.path.isfile(img_data["full"]) and os.path.isfile(img_data["thumb"]):
				os.unlink(img_data["thumb"])
				print("Deleted thumbnail for %s" % img_data["filename"])
				r.lrem(key, 0, val)
				print("Deleted value for %s" % img_data["filename"])
			elif os.path.isfile(img_data["full"]) and not os.path.isfile(img_data["thumb"]):
				os.unlink(img_data["full"])
				print("Deleted full for %s" % img_data["filename"])
				r.lrem(key, 0, val)
				print("Deleted value for %s" % img_data["filename"])
			else:
				safe_files.append(os.path.normpath(img_data["full"]))
				safe_files.append(os.path.normpath(img_data["thumb"]))

thumbdirs = [name for name in os.listdir("./server/images/thumbs/") if os.path.isdir(os.path.join("./server/images/thumbs/",name))]
fulldirs = [name for name in os.listdir("./server/images/full/") if os.path.isdir(os.path.join("./server/images/full/",name))]

rooms = {}

print("SAFE FILES: ")
[print("\t%s" % safe) for safe in safe_files]
for d in thumbdirs:
	images = os.listdir(os.path.join(os.getcwd(),"server/images/thumbs/", d))
	for img in images:
		full_img = os.path.normpath(os.path.join(os.getcwd(), "server/images/thumbs/", d, img))
		if full_img not in safe_files:
			os.unlink(full_img)
			print("Deleted %s" % full_img)

for d in fulldirs:
	images = os.listdir(os.path.join(os.getcwd(), "server/images/full/", d))
	for img in images:
		full_img = os.path.normpath(os.path.join(os.getcwd(), "server/images/full/", d, img))
		if full_img not in safe_files:
			os.unlink(full_img)
			print("Deleted %s" % full_img)

