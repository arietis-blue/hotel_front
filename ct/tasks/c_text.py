from __future__ import absolute_import, unicode_literals
import os
import io
import json
import requests
from celery import Celery, shared_task
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent.parent.joinpath(".env"))
API_KEY =os.environ["HP_API"]# set your api_key
URL = 'http://webservice.recruit.co.jp/hotpepper/gourmet/v1/'

@shared_task
def res(lat,lng):
    body = {
        'key':API_KEY,
        'lng':lng,
        'lat':lat, 
        'range':1,
        'count':10,
        'order':4,
        'format':'json',
    }
    resta = requests.get(URL,body)
    # // 取得したデータからJSONデータを取得
    datum = resta.json()
    # // JSONデータの中からお店のデータを取得
    stores = datum['results']['shop']
    # // お店のデータの中から、店名を抜き出して表示させる
    store_list=[]
    for store_name in stores:
        restaurant={}
        restaurant['name']=store_name['name']
        restaurant['lat']=store_name['lat']
        restaurant['lng']=store_name['lng']
        restaurant['url']=store_name['urls']['pc']
        store_list.append(restaurant)
    response = json.dumps(store_list)
    return response

