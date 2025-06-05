from json import JSONEncoder
from bson import ObjectId
from rest_framework.renderers import JSONRenderer

class MongoJSONEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        # Gérer aussi les objets datetime si nécessaire
        elif hasattr(obj, 'isoformat'):  # Pour les objets datetime
            return obj.isoformat()
        return super().default(obj)

class MongoJSONRenderer(JSONRenderer):
    encoder_class = MongoJSONEncoder